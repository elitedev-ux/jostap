import { useEffect, useState } from "react";
import { CheckCircle2, Package, RefreshCcw, ShoppingBag, Sparkles } from "lucide-react";
import ShopNfcCardPreview from "../../../components/shop/ShopNfcCardPreview";
import "./shop.css";

const DEFAULT_PRODUCTS = [
  {
    id: "lagos-vibes-nfc-card",
    slug: "lagos-vibes-nfc-card",
    name: "Lagos Vibes NFC Card",
    subtitle: "Tap-to-share NFC business card",
    description:
      "A ready-to-order NFC card with a Lagos-inspired front, QR-enabled back, and digital profile connection.",
    badge: "Available now",
    priceCents: 2000000,
    currency: "NGN",
    checkoutPath: "/checkout?plan=jostap_nfc&billing=one_time",
    artworkKey: "lagos_vibes",
    frontImageUrl: "",
    backImageUrl: "",
    inventoryStatus: "available",
    sortOrder: 10,
    isActive: true,
  },
];

function money(cents, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(cents || 0) / 100);
}

function inventoryLabel(status) {
  return {
    available: "Available",
    limited: "Limited stock",
    sold_out: "Sold out",
    draft: "Draft",
  }[status] || "Available";
}

function checkoutPathFor(product) {
  const slug = String(product?.slug || product?.id || "").trim();
  if (slug) {
    return `/checkout?product=${encodeURIComponent(slug)}`;
  }

  return product.checkoutPath || "/checkout?plan=jostap_nfc&billing=one_time";
}

export default function ShopPage() {
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function loadProducts() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await fetch("/api/shop/products", { credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to load shop products.");
      const nextProducts = Array.isArray(data.products) ? data.products : DEFAULT_PRODUCTS;
      setProducts(nextProducts.filter((product) => product.isActive !== false));
    } catch (error) {
      setProducts(DEFAULT_PRODUCTS);
      setLoadError(error.message || "Unable to load shop products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  const featuredProduct = products[0] || null;
  const availableCount = products.filter((product) => product.inventoryStatus !== "sold_out").length;

  return (
    <div className="shop-page">
      <section className="shop-page__hero">
        <div className="shop-page__content">
          <span className="shop-page__eyebrow">
            <ShoppingBag size={15} />
            JOSTAP Shop
          </span>

          <h1>Order NFC products for your brand.</h1>
          <p>
            Choose a card design, preview the front and back, then start your order directly from the dashboard.
          </p>

          <div className="shop-page__hero-meta">
            <span>
              <CheckCircle2 size={15} />
              {availableCount} available
            </span>
            <span>
              <Sparkles size={15} />
              Interactive card view
            </span>
          </div>

          {loadError && (
            <button type="button" className="shop-page__retry" onClick={loadProducts}>
              <RefreshCcw size={14} />
              Retry product sync
            </button>
          )}
        </div>

        <div className="shop-page__feature">
          {featuredProduct ? (
            <>
              <ShopNfcCardPreview product={featuredProduct} />
              <div className="shop-page__feature-copy">
                <span>{featuredProduct.badge || inventoryLabel(featuredProduct.inventoryStatus)}</span>
                <h2>{featuredProduct.name}</h2>
                <p>{featuredProduct.subtitle || featuredProduct.description}</p>
                <strong>{money(featuredProduct.priceCents, featuredProduct.currency)}</strong>
              </div>
            </>
          ) : (
            <div className="shop-page__empty-feature">
              <ShoppingBag size={24} />
              <h2>No products listed</h2>
              <p>Published products will appear here after an admin adds them.</p>
            </div>
          )}
        </div>
      </section>

      {products.length === 0 && (
        <div className="shop-page__empty">
          <ShoppingBag size={22} />
          <div>
            <h2>No shop products available</h2>
            <p>Check back after products are published by the admin team.</p>
          </div>
        </div>
      )}

      <section className="shop-page__toolbar" aria-label="Shop status">
        <div>
          <Package size={16} />
          <span>{loading ? "Loading products..." : `${products.length} product${products.length === 1 ? "" : "s"} listed`}</span>
        </div>
        <button type="button" onClick={loadProducts}>
          <RefreshCcw size={14} />
          Refresh
        </button>
      </section>

      <section className="shop-page__grid" aria-label="Available shop products">
        {products.map((product) => {
          const soldOut = product.inventoryStatus === "sold_out";
          return (
            <article className="shop-product" key={product.id || product.slug}>
              <div className="shop-product__preview">
                <ShopNfcCardPreview product={product} compact />
              </div>
              <div className="shop-product__body">
                <div className="shop-product__topline">
                  <span>{product.badge || inventoryLabel(product.inventoryStatus)}</span>
                  <strong>{money(product.priceCents, product.currency)}</strong>
                </div>
                <h2>{product.name}</h2>
                <p>{product.description}</p>
                <a
                  className={soldOut ? "shop-product__cta is-disabled" : "shop-product__cta"}
                  href={soldOut ? undefined : checkoutPathFor(product)}
                  aria-disabled={soldOut}
                >
                  {soldOut ? "Sold out" : "Order card"}
                </a>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
