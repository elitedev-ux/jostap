import { json } from "../../utils/http.js";
import { getSupabaseAdmin, hasSupabase } from "../../utils/supabase.js";
import {
  DEFAULT_SHOP_PRODUCT,
  SHOP_PRODUCTS_PAGE_SLUG,
  isMissingShopProductsTable,
  parseShopProductsContent,
  shopProductFromRow,
  sortShopProducts,
} from "../../utils/shopProducts.js";

async function readStaticProducts(supabase) {
  const { data, error } = await supabase
    .from("static_pages")
    .select("content")
    .eq("slug", SHOP_PRODUCTS_PAGE_SLUG)
    .maybeSingle();

  if (error) throw error;

  if (data?.content == null) {
    return [DEFAULT_SHOP_PRODUCT];
  }

  return sortShopProducts(parseShopProductsContent(data.content))
    .filter((product) => product.isActive !== false && product.inventoryStatus !== "draft");
}

export async function GET() {
  if (!hasSupabase()) {
    return json({ products: [DEFAULT_SHOP_PRODUCT], fallback: true });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shop_products")
    .select("*")
    .eq("is_active", true)
    .neq("inventory_status", "draft")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingShopProductsTable(error)) {
      return json({ products: await readStaticProducts(supabase), fallback: true });
    }
    throw error;
  }

  const products = (data || []).map(shopProductFromRow);
  return json({ products });
}
