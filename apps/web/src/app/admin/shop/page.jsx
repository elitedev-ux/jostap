import { useEffect, useMemo, useState } from "react";
import { Edit3, ImagePlus, PackagePlus, RefreshCcw, Save, ShoppingBag, ToggleLeft, ToggleRight, X } from "lucide-react";

const emptyForm = {
  id: "",
  name: "",
  slug: "",
  subtitle: "",
  description: "",
  badge: "Available now",
  priceNaira: "40000",
  currency: "NGN",
  checkoutPath: "/checkout?plan=jostap_nfc&billing=one_time",
  artworkKey: "lagos_vibes",
  frontImageUrl: "",
  backImageUrl: "",
  inventoryStatus: "available",
  sortOrder: "10",
  isActive: true,
};

function slugFromName(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function money(cents, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(cents || 0) / 100);
}

function formFromProduct(product) {
  return {
    id: product.id,
    name: product.name || "",
    slug: product.slug || "",
    subtitle: product.subtitle || "",
    description: product.description || "",
    badge: product.badge || "",
    priceNaira: String(Math.round(Number(product.priceCents || 0) / 100)),
    currency: product.currency || "NGN",
    checkoutPath: product.checkoutPath || "/checkout?plan=jostap_nfc&billing=one_time",
    artworkKey: product.artworkKey || "lagos_vibes",
    frontImageUrl: product.frontImageUrl || "",
    backImageUrl: product.backImageUrl || "",
    inventoryStatus: product.inventoryStatus || "available",
    sortOrder: String(product.sortOrder || 0),
    isActive: Boolean(product.isActive),
  };
}

function payloadFromForm(form) {
  return {
    name: form.name,
    slug: form.slug || slugFromName(form.name),
    subtitle: form.subtitle,
    description: form.description,
    badge: form.badge,
    priceCents: Math.max(0, Math.round(Number(form.priceNaira || 0) * 100)),
    currency: form.currency || "NGN",
    checkoutPath: form.checkoutPath,
    artworkKey: form.artworkKey,
    frontImageUrl: form.frontImageUrl,
    backImageUrl: form.backImageUrl,
    inventoryStatus: form.inventoryStatus,
    sortOrder: Math.round(Number(form.sortOrder || 0)),
    isActive: form.isActive,
  };
}

export default function AdminShopPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState("");

  const filteredProducts = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return products;
    return products.filter((product) =>
      [product.name, product.slug, product.subtitle, product.inventoryStatus]
        .some((value) => String(value || "").toLowerCase().includes(search)),
    );
  }, [products, query]);

  async function loadProducts() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/shop-products", { credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to load shop products.");
      setProducts(data.products || []);
    } catch (loadError) {
      setError(loadError.message || "Unable to load shop products.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function updateForm(key, value) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "name" && !current.id && (!current.slug || current.slug === slugFromName(current.name))) {
        next.slug = slugFromName(value);
      }
      return next;
    });
  }

  async function saveProduct(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const endpoint = form.id ? `/api/admin/shop-products/${form.id}` : "/api/admin/shop-products";
      const response = await fetch(endpoint, {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payloadFromForm(form)),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to save product.");

      setNotice(form.id ? "Product updated." : "Product added to the shop.");
      setForm(emptyForm);
      await loadProducts();
    } catch (saveError) {
      setError(saveError.message || "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadArtwork(event, field) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingField(field);
    setError("");
    setNotice("");

    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/cards/media", {
        method: "POST",
        credentials: "same-origin",
        body,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to upload artwork.");
      updateForm(field, data.url || "");
      setNotice("Artwork uploaded.");
    } catch (uploadError) {
      setError(uploadError.message || "Unable to upload artwork.");
    } finally {
      setUploadingField("");
    }
  }

  async function toggleProduct(product) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/shop-products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Unable to update product.");
      setNotice(product.isActive ? "Product hidden from shop." : "Product published to shop.");
      await loadProducts();
    } catch (toggleError) {
      setError(toggleError.message || "Unable to update product.");
    }
  }

  return (
    <div className="admin-shop">
      <div className="admin-shop__header">
        <div>
          <h1>Shop Products</h1>
          <p>Add NFC products and publish them automatically to the customer shop with the 3D preview template.</p>
        </div>
        <button type="button" onClick={loadProducts}>
          <RefreshCcw size={15} />
          Refresh
        </button>
      </div>

      {(error || notice) && (
        <div className={error ? "admin-shop__alert admin-shop__alert--error" : "admin-shop__alert"}>
          {error || notice}
        </div>
      )}

      <section className="admin-shop__panel">
        <div className="admin-shop__panel-heading">
          <div>
            <span>
              <PackagePlus size={16} />
            </span>
            <div>
              <h2>{form.id ? "Edit product" : "Add product"}</h2>
              <p>{form.id ? "Update the selected shop item." : "Create a product customers can order from the shop."}</p>
            </div>
          </div>
          {form.id && (
            <button type="button" onClick={() => setForm(emptyForm)} className="admin-shop__ghost">
              <X size={14} />
              New product
            </button>
          )}
        </div>

        <form className="admin-shop__form" onSubmit={saveProduct}>
          <label>
            Product name
            <input value={form.name} onChange={(event) => updateForm("name", event.target.value)} placeholder="Lagos Vibes NFC Card" required />
          </label>
          <label>
            Slug
            <input value={form.slug} onChange={(event) => updateForm("slug", slugFromName(event.target.value))} placeholder="lagos-vibes-nfc-card" required />
          </label>
          <label>
            Subtitle
            <input value={form.subtitle} onChange={(event) => updateForm("subtitle", event.target.value)} placeholder="Tap-to-share NFC business card" />
          </label>
          <label>
            Badge
            <input value={form.badge} onChange={(event) => updateForm("badge", event.target.value)} placeholder="Available now" />
          </label>
          <label>
            Price (NGN)
            <input type="number" min="0" value={form.priceNaira} onChange={(event) => updateForm("priceNaira", event.target.value)} />
          </label>
          <label>
            Inventory
            <select value={form.inventoryStatus} onChange={(event) => updateForm("inventoryStatus", event.target.value)}>
              <option value="available">Available</option>
              <option value="limited">Limited</option>
              <option value="sold_out">Sold out</option>
              <option value="draft">Draft</option>
            </select>
          </label>
          <label>
            Sort order
            <input type="number" value={form.sortOrder} onChange={(event) => updateForm("sortOrder", event.target.value)} />
          </label>
          <label>
            3D artwork template
            <select value={form.artworkKey} onChange={(event) => updateForm("artworkKey", event.target.value)}>
              <option value="lagos_vibes">Lagos Vibes</option>
              <option value="custom">Custom front/back URLs</option>
            </select>
          </label>
          <label className="admin-shop__wide">
            Description
            <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} rows={4} placeholder="Describe what customers are ordering." />
          </label>
          <label className="admin-shop__wide">
            Checkout path
            <input value={form.checkoutPath} onChange={(event) => updateForm("checkoutPath", event.target.value)} placeholder="/checkout?plan=jostap_nfc&billing=one_time" />
          </label>
          <label className="admin-shop__wide">
            Front image URL
            <div className="admin-shop__upload-row">
              <input value={form.frontImageUrl} onChange={(event) => updateForm("frontImageUrl", event.target.value)} placeholder="Leave empty to use selected template" />
              <span>
                <ImagePlus size={14} />
                {uploadingField === "frontImageUrl" ? "Uploading" : "Upload"}
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadArtwork(event, "frontImageUrl")} />
              </span>
            </div>
          </label>
          <label className="admin-shop__wide">
            Back image URL
            <div className="admin-shop__upload-row">
              <input value={form.backImageUrl} onChange={(event) => updateForm("backImageUrl", event.target.value)} placeholder="Leave empty to use selected template" />
              <span>
                <ImagePlus size={14} />
                {uploadingField === "backImageUrl" ? "Uploading" : "Upload"}
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadArtwork(event, "backImageUrl")} />
              </span>
            </div>
          </label>
          <label className="admin-shop__check">
            <input type="checkbox" checked={form.isActive} onChange={(event) => updateForm("isActive", event.target.checked)} />
            Publish in shop
          </label>
          <button type="submit" disabled={saving || uploadingField}>
            <Save size={15} />
            {saving ? "Saving..." : form.id ? "Save changes" : "Add product"}
          </button>
        </form>
      </section>

      <section className="admin-shop__panel">
        <div className="admin-shop__panel-heading">
          <div>
            <span>
              <ShoppingBag size={16} />
            </span>
            <div>
              <h2>Listed products</h2>
              <p>{products.length} product{products.length === 1 ? "" : "s"} in the catalog.</p>
            </div>
          </div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products..." />
        </div>

        <div className="admin-shop__table-wrap">
          <table className="admin-shop__table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Status</th>
                <th>Template</th>
                <th>Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6}>Loading products...</td>
                </tr>
              )}
              {!loading && filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6}>No shop products found.</td>
                </tr>
              )}
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    <span>{product.slug}</span>
                  </td>
                  <td>{money(product.priceCents, product.currency)}</td>
                  <td>{product.inventoryStatus}</td>
                  <td>{product.artworkKey || "lagos_vibes"}</td>
                  <td>{product.isActive ? "Published" : "Hidden"}</td>
                  <td>
                    <button type="button" onClick={() => setForm(formFromProduct(product))}>
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button type="button" onClick={() => toggleProduct(product)}>
                      {product.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                      {product.isActive ? "Hide" : "Publish"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style jsx>{`
        .admin-shop { display: grid; gap: 18px; }
        .admin-shop__header,
        .admin-shop__panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .admin-shop__header h1 { margin: 0 0 4px; color: #111827; font-size: 24px; font-weight: 900; }
        .admin-shop__header p,
        .admin-shop__panel-heading p { margin: 0; color: #6b7280; font-size: 13px; line-height: 1.5; }
        .admin-shop__header button,
        .admin-shop__ghost,
        .admin-shop__form button,
        .admin-shop__table button { min-height: 38px; display: inline-flex; align-items: center; justify-content: center; gap: 7px; border-radius: 9px; font-size: 13px; font-weight: 800; cursor: pointer; }
        .admin-shop__header button,
        .admin-shop__ghost,
        .admin-shop__table button { border: 1px solid #e5e7eb; background: #fff; color: #374151; padding: 0 12px; }
        .admin-shop__alert { border: 1px solid #bbf7d0; border-radius: 10px; background: #f0fdf4; color: #047857; padding: 11px 13px; font-size: 13px; font-weight: 800; }
        .admin-shop__alert--error { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }
        .admin-shop__panel { border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; padding: 18px; }
        .admin-shop__panel-heading { margin-bottom: 16px; }
        .admin-shop__panel-heading > div { display: flex; align-items: center; gap: 10px; }
        .admin-shop__panel-heading span:first-child { width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; border-radius: 9px; background: #eaf3ff; color: #0d6ffd; }
        .admin-shop__panel-heading h2 { margin: 0 0 2px; color: #111827; font-size: 17px; font-weight: 900; }
        .admin-shop__panel-heading > input { min-height: 38px; border: 1px solid #e5e7eb; border-radius: 9px; padding: 0 11px; font-size: 13px; outline: none; }
        .admin-shop__form { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; }
        .admin-shop__form label { display: grid; gap: 7px; color: #374151; font-size: 12px; font-weight: 850; }
        .admin-shop__form input,
        .admin-shop__form select,
        .admin-shop__form textarea { width: 100%; border: 1px solid #e5e7eb; border-radius: 9px; background: #fff; color: #111827; padding: 10px 11px; font-size: 13px; outline: none; box-sizing: border-box; }
        .admin-shop__form textarea { resize: vertical; line-height: 1.45; }
        .admin-shop__wide { grid-column: span 2; }
        .admin-shop__upload-row { display: flex; gap: 8px; }
        .admin-shop__upload-row > input { min-width: 0; }
        .admin-shop__upload-row > span { position: relative; min-width: 98px; min-height: 38px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid #dbe3ef; border-radius: 9px; background: #f8fbff; color: #0d6ffd; font-size: 12px; font-weight: 900; overflow: hidden; }
        .admin-shop__upload-row input[type="file"] { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
        .admin-shop__check { display: inline-flex !important; grid-template-columns: auto 1fr; align-items: center; gap: 9px !important; align-self: end; min-height: 38px; }
        .admin-shop__check input { width: 16px; height: 16px; }
        .admin-shop__form button[type="submit"] { align-self: end; border: none; background: #0d6ffd; color: #fff; padding: 0 14px; }
        .admin-shop__form button:disabled { opacity: 0.7; cursor: wait; }
        .admin-shop__table-wrap { overflow-x: auto; }
        .admin-shop__table { width: 100%; border-collapse: collapse; }
        .admin-shop__table th { padding: 11px 12px; background: #f8fafc; color: #64748b; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.04em; text-align: left; }
        .admin-shop__table td { padding: 13px 12px; border-top: 1px solid #f1f5f9; color: #374151; font-size: 13px; white-space: nowrap; }
        .admin-shop__table td:first-child { min-width: 220px; white-space: normal; }
        .admin-shop__table strong,
        .admin-shop__table span { display: block; }
        .admin-shop__table strong { color: #111827; font-weight: 900; }
        .admin-shop__table span { color: #64748b; font-size: 12px; margin-top: 3px; }
        .admin-shop__table td:last-child { display: flex; gap: 8px; }
        @media (max-width: 1080px) {
          .admin-shop__form { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .admin-shop__panel { padding: 14px; }
          .admin-shop__form { grid-template-columns: 1fr; }
          .admin-shop__wide { grid-column: span 1; }
          .admin-shop__upload-row { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
