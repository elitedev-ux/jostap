import { useEffect, useState } from "react";
import { CheckCircle2, Package, RefreshCcw, ShoppingBag, Sparkles } from "lucide-react";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import ShopNfcCardPreview from "../../components/shop/ShopNfcCardPreview";
import "../dashboard/shop/shop.css";
import "./page.css";

const DEFAULT_PRODUCTS = [
  {
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

function signupPathFor(product) {
  return `/auth/signup?callbackUrl=${encodeURIComponent(checkoutPathFor(product))}`;
}

export default function PublicShopPage() {
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
    <div className="public-shop-page">
      <Navbar />
      <main className="public-shop-main shop-page">
        <section className="shop-page__hero public-shop-hero">
          <div className="shop-page__content">
            <span className="shop-page__eyebrow">
              <ShoppingBag size={15} />
              JOSTAP Shop
            </span>

            <h1>NFC products for faster business sharing.</h1>
            <p>
              Preview available NFC cards, choose the design you want, then create your account to complete purchase.
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
                  {featuredProduct.inventoryStatus === "sold_out" ? (
                    <span className="public-shop-feature-cta is-disabled">Sold out</span>
                  ) : (
                    <a className="public-shop-feature-cta" href={signupPathFor(featuredProduct)}>
                      Create account to order
                    </a>
                  )}
                </div>
              </>
            ) : (
              <div className="shop-page__empty-feature">
                <ShoppingBag size={24} />
                <h2>No products listed</h2>
                <p>Published products will appear here soon.</p>
              </div>
            )}
          </div>
        </section>

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

        {products.length === 0 && (
          <div className="shop-page__empty">
            <ShoppingBag size={22} />
            <div>
              <h2>No shop products available</h2>
              <p>Check back after new products are published.</p>
            </div>
          </div>
        )}

        <section className="shop-page__grid public-shop-grid" aria-label="Available shop products">
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
                    href={soldOut ? undefined : signupPathFor(product)}
                    aria-disabled={soldOut}
                  >
                    {soldOut ? "Sold out" : "Create account to order"}
                  </a>
                </div>
              </article>
            );
          })}
        </section>
      </main>
      <Footer />
    </div>
  );
}
