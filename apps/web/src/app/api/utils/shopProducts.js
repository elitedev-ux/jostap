export const DEFAULT_SHOP_PRODUCT = {
  id: "lagos-vibes-nfc-card",
  slug: "lagos-vibes-nfc-card",
  name: "Lagos Vibes NFC Card",
  subtitle: "Tap-to-share NFC business card",
  description:
    "A ready-to-order NFC card with a Lagos-inspired front, QR-enabled back, and digital profile connection.",
  badge: "Available now",
  priceCents: 2500000,
  currency: "NGN",
  checkoutPath: "/checkout?plan=jostap_nfc&billing=one_time",
  artworkKey: "lagos_vibes",
  frontImageUrl: "",
  backImageUrl: "",
  inventoryStatus: "available",
  sortOrder: 10,
  isActive: true,
  createdAt: "",
};

export const SHOP_PRODUCTS_PAGE_SLUG = "shop-products";

export function isMissingShopProductsTable(error) {
  return error?.code === "42P01" || /shop_products/i.test(error?.message || "");
}

export function shopProductFromRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    subtitle: row.subtitle || "",
    description: row.description || "",
    badge: row.badge || "",
    priceCents: Number(row.price_cents || 0),
    currency: row.currency || "NGN",
    checkoutPath: row.checkout_path || "/checkout?plan=jostap_nfc&billing=one_time",
    artworkKey: row.artwork_key || "lagos_vibes",
    frontImageUrl: row.front_image_url || "",
    backImageUrl: row.back_image_url || "",
    inventoryStatus: row.inventory_status || "available",
    sortOrder: Number(row.sort_order || 0),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at || "",
  };
}

export function parseShopProductsContent(content) {
  try {
    const parsed = JSON.parse(content || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function sortShopProducts(products) {
  return [...(products || [])].sort((a, b) => {
    const created = createdTime(b) - createdTime(a);
    if (created) return created;
    const order = Number(a.sortOrder || 0) - Number(b.sortOrder || 0);
    if (order) return order;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
}

export function normalizeShopProductInput(body, { partial = false } = {}) {
  const input = body || {};
  const normalized = {};
  const textFields = [
    ["slug", 100],
    ["name", 140],
    ["subtitle", 180],
    ["description", 1200],
    ["badge", 80],
    ["currency", 12],
    ["checkoutPath", 500],
    ["artworkKey", 80],
    ["frontImageUrl", 1000],
    ["backImageUrl", 1000],
    ["inventoryStatus", 24],
  ];

  for (const [key, maxLength] of textFields) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      normalized[key] = String(input[key] || "").trim().slice(0, maxLength);
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, "priceCents")) {
    normalized.priceCents = Math.max(0, Math.round(Number(input.priceCents || 0)));
  }

  if (Object.prototype.hasOwnProperty.call(input, "sortOrder")) {
    normalized.sortOrder = Math.round(Number(input.sortOrder || 0));
  }

  if (Object.prototype.hasOwnProperty.call(input, "isActive")) {
    normalized.isActive = Boolean(input.isActive);
  }

  if (!partial) {
    normalized.slug = normalized.slug || slugFromName(normalized.name);
    normalized.name = normalized.name || "";
    normalized.description = normalized.description || "";
    normalized.currency = normalized.currency || "NGN";
    normalized.checkoutPath = normalized.checkoutPath || "/checkout?plan=jostap_nfc&billing=one_time";
    normalized.artworkKey = normalized.artworkKey || "lagos_vibes";
    normalized.inventoryStatus = normalized.inventoryStatus || "available";
    normalized.priceCents = normalized.priceCents ?? 0;
    normalized.sortOrder = normalized.sortOrder ?? 0;
    normalized.isActive = normalized.isActive ?? true;
  }

  return normalized;
}

export function shopProductPayload(input) {
  const payload = {};
  const fields = [
    ["slug", "slug", (value) => value],
    ["name", "name", (value) => value],
    ["subtitle", "subtitle", (value) => value || null],
    ["description", "description", (value) => value || ""],
    ["badge", "badge", (value) => value || null],
    ["priceCents", "price_cents", (value) => value ?? 0],
    ["currency", "currency", (value) => value || "NGN"],
    ["checkoutPath", "checkout_path", (value) => value || "/checkout?plan=jostap_nfc&billing=one_time"],
    ["artworkKey", "artwork_key", (value) => value || "lagos_vibes"],
    ["frontImageUrl", "front_image_url", (value) => value || null],
    ["backImageUrl", "back_image_url", (value) => value || null],
    ["inventoryStatus", "inventory_status", (value) => value || "available"],
    ["sortOrder", "sort_order", (value) => value ?? 0],
    ["isActive", "is_active", (value) => value ?? true],
  ];

  for (const [source, target, transform] of fields) {
    if (Object.prototype.hasOwnProperty.call(input, source)) {
      payload[target] = transform(input[source]);
    }
  }

  return payload;
}

export function validateShopProduct(input) {
  const errors = [];
  const statuses = new Set(["available", "limited", "sold_out", "draft"]);

  if (!input.name) errors.push("Product name is required.");
  if (!input.slug) errors.push("Product slug is required.");
  if (input.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    errors.push("Product slug can only use lowercase letters, numbers, and hyphens.");
  }
  if (input.checkoutPath && !input.checkoutPath.startsWith("/") && !/^https?:\/\//i.test(input.checkoutPath)) {
    errors.push("Checkout path must be a site path or a full URL.");
  }
  if (input.inventoryStatus && !statuses.has(input.inventoryStatus)) {
    errors.push("Inventory status is invalid.");
  }

  return errors;
}

function slugFromName(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function createdTime(product) {
  const timestamp = Date.parse(product?.createdAt || "");
  return Number.isFinite(timestamp) ? timestamp : 0;
}
