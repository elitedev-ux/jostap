import { randomUUID } from "node:crypto";
import { badRequest, json } from "../../utils/http.js";
import { requireAdmin, logAdminAction } from "../../utils/admin.js";
import { getSupabaseAdmin, isUniqueViolation } from "../../utils/supabase.js";
import {
  DEFAULT_SHOP_PRODUCT,
  SHOP_PRODUCTS_PAGE_SLUG,
  isMissingShopProductsTable,
  normalizeShopProductInput,
  parseShopProductsContent,
  shopProductFromRow,
  shopProductPayload,
  sortShopProducts,
  validateShopProduct,
} from "../../utils/shopProducts.js";

async function readStaticProducts(supabase) {
  const { data, error } = await supabase
    .from("static_pages")
    .select("content")
    .eq("slug", SHOP_PRODUCTS_PAGE_SLUG)
    .maybeSingle();

  if (error) throw error;

  if (data?.content != null) {
    return sortShopProducts(parseShopProductsContent(data.content));
  }

  return [DEFAULT_SHOP_PRODUCT];
}

async function writeStaticProducts(supabase, products) {
  const { error } = await supabase.from("static_pages").upsert(
    {
      slug: SHOP_PRODUCTS_PAGE_SLUG,
      title: "Shop Products",
      content: JSON.stringify(sortShopProducts(products)),
      is_published: true,
    },
    { onConflict: "slug" },
  );

  if (error) throw error;
}

export async function GET(request) {
  const { response } = await requireAdmin(request, "content:manage");
  if (response) return response;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shop_products")
    .select("*")
    .order("created_at", { ascending: false })
    .order("sort_order", { ascending: true });

  if (isMissingShopProductsTable(error)) {
    return json({ products: await readStaticProducts(supabase), storage: "static_pages" });
  }

  if (error) throw error;

  return json({ products: (data || []).map(shopProductFromRow) });
}

export async function POST(request) {
  const { user: adminUser, response } = await requireAdmin(request, "content:manage");
  if (response) return response;

  const body = await request.json().catch(() => null);
  const input = normalizeShopProductInput(body);
  const errors = validateShopProduct(input);

  if (errors.length) {
    return badRequest(errors[0], errors);
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shop_products")
    .insert(shopProductPayload(input))
    .select("*")
    .single();

  if (isMissingShopProductsTable(error)) {
    const products = await readStaticProducts(supabase);
    if (products.some((product) => product.slug === input.slug)) {
      return badRequest("A shop product with this slug already exists.");
    }
    const product = {
      ...DEFAULT_SHOP_PRODUCT,
      ...input,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await writeStaticProducts(supabase, [...products, product]);
    await logAdminAction(supabase, adminUser, "shop_products.created", "shop_products", product.id, {
      slug: product.slug,
      name: product.name,
      storage: "static_pages",
    });
    return json({ product }, { status: 201 });
  }

  if (isUniqueViolation(error)) {
    return badRequest("A shop product with this slug already exists.");
  }

  if (error) throw error;

  await logAdminAction(supabase, adminUser, "shop_products.created", "shop_products", data.id, {
    slug: data.slug,
    name: data.name,
  });

  return json({ product: shopProductFromRow(data) }, { status: 201 });
}
