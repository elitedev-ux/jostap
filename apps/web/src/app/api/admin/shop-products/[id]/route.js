import { badRequest, json } from "../../../utils/http.js";
import { requireAdmin, logAdminAction } from "../../../utils/admin.js";
import { getSupabaseAdmin, isUniqueViolation } from "../../../utils/supabase.js";
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
} from "../../../utils/shopProducts.js";

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

export async function PATCH(request, { params }) {
  const { user: adminUser, response } = await requireAdmin(request, "content:manage");
  if (response) return response;

  const body = await request.json().catch(() => null);
  const input = normalizeShopProductInput(body, { partial: true });
  const errors = validateShopProduct({ ...input, name: input.name ?? "Existing product", slug: input.slug ?? "existing-product" });

  if (errors.length) {
    return badRequest(errors[0], errors);
  }

  const payload = shopProductPayload(input);

  if (!Object.keys(payload).length) {
    return badRequest("No valid updates provided.");
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shop_products")
    .update(payload)
    .eq("id", params.id)
    .select("*")
    .single();

  if (isMissingShopProductsTable(error)) {
    const products = await readStaticProducts(supabase);
    const productIndex = products.findIndex((product) => product.id === params.id);

    if (productIndex === -1) {
      return json({ error: "Shop product not found." }, { status: 404 });
    }

    if (input.slug && products.some((product) => product.id !== params.id && product.slug === input.slug)) {
      return badRequest("A shop product with this slug already exists.");
    }

    const nextProduct = {
      ...products[productIndex],
      ...input,
    };
    const nextProducts = products.map((product, index) => (index === productIndex ? nextProduct : product));
    await writeStaticProducts(supabase, nextProducts);
    await logAdminAction(supabase, adminUser, "shop_products.updated", "shop_products", params.id, {
      ...payload,
      storage: "static_pages",
    });

    return json({ product: nextProduct });
  }

  if (isUniqueViolation(error)) {
    return badRequest("A shop product with this slug already exists.");
  }

  if (error) throw error;

  await logAdminAction(supabase, adminUser, "shop_products.updated", "shop_products", params.id, payload);

  return json({ product: shopProductFromRow(data) });
}

export async function DELETE(request, { params }) {
  const { user: adminUser, response } = await requireAdmin(request, "content:manage");
  if (response) return response;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shop_products")
    .delete()
    .eq("id", params.id)
    .select("id,slug,name")
    .maybeSingle();

  if (isMissingShopProductsTable(error)) {
    const products = await readStaticProducts(supabase);
    const product = products.find((item) => item.id === params.id);

    if (!product) {
      return json({ error: "Shop product not found." }, { status: 404 });
    }

    await writeStaticProducts(supabase, products.filter((item) => item.id !== params.id));
    await logAdminAction(supabase, adminUser, "shop_products.deleted", "shop_products", params.id, {
      slug: product.slug,
      name: product.name,
      storage: "static_pages",
    });

    return json({ deleted: true });
  }

  if (error) throw error;

  if (!data) {
    return json({ error: "Shop product not found." }, { status: 404 });
  }

  await logAdminAction(supabase, adminUser, "shop_products.deleted", "shop_products", params.id, {
    slug: data.slug,
    name: data.name,
  });

  return json({ deleted: true });
}
