import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CheckCircle2, Package, RefreshCcw, ShoppingBag, Sparkles } from "lucide-react";
import lagosVibesBack from "../../../assets/Lagos Vibes Back.png";
import lagosVibesFront from "../../../assets/Lagos Vibes front.png";
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
    priceCents: 4000000,
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

const BUILT_IN_ARTWORK = {
  lagos_vibes: {
    front: lagosVibesFront,
    back: lagosVibesBack,
    crop: {
      offsetX: 552 / 4000,
      offsetY: 580 / 3000,
      width: 2875,
      height: 1809,
      repeatX: 2875 / 4000,
      repeatY: 1809 / 3000,
    },
  },
};

const FULL_ARTWORK_CROP = {
  offsetX: 0,
  offsetY: 0,
  width: 2875,
  height: 1809,
  repeatX: 1,
  repeatY: 1,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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

function nearestCardFaceAngle(angle) {
  const fullTurn = Math.PI * 2;
  const normalized = ((angle % fullTurn) + fullTurn) % fullTurn;
  const faceAngle = normalized > Math.PI / 2 && normalized < Math.PI * 1.5 ? Math.PI : 0;
  let delta = faceAngle - normalized;

  if (delta > Math.PI) delta -= fullTurn;
  if (delta < -Math.PI) delta += fullTurn;

  return angle + delta;
}

function roundedCardShape(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  return shape;
}

function mapGeometryUv(geometry, width, height) {
  const positions = geometry.attributes.position;
  const uvs = [];

  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    uvs.push((x + width / 2) / width, (y + height / 2) / height);
  }

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
}

function artworkForProduct(product) {
  const builtIn = BUILT_IN_ARTWORK[product?.artworkKey] || BUILT_IN_ARTWORK.lagos_vibes;
  const hasCustomArtwork = product?.frontImageUrl && product?.backImageUrl;

  return {
    front: hasCustomArtwork ? product.frontImageUrl : builtIn.front,
    back: hasCustomArtwork ? product.backImageUrl : builtIn.back,
    crop: hasCustomArtwork ? FULL_ARTWORK_CROP : builtIn.crop,
  };
}

function ShopNfcCardPreview({ product, compact = false }) {
  const mountRef = useRef(null);
  const artwork = useMemo(() => artworkForProduct(product), [product]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const width = 3.4;
    const height = width / (artwork.crop.width / artwork.crop.height);
    const faceGap = 0.006;
    const shape = roundedCardShape(width, height, 0.14);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    const group = new THREE.Group();
    const interaction = {
      dragging: false,
      lastX: 0,
      lastY: 0,
      targetX: -0.08,
      targetY: -0.48,
      hoverX: 0,
      hoverY: 0,
    };
    let frame = 0;
    let disposed = false;

    camera.position.set(0, 0, compact ? 6.4 : 6);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);
    mount.classList.add("is-ready");
    renderer.domElement.setAttribute("aria-label", `3D preview of ${product?.name || "NFC card"}`);
    renderer.domElement.setAttribute("role", "img");

    const frontGeometry = new THREE.ShapeGeometry(shape);
    const backGeometry = new THREE.ShapeGeometry(shape);
    mapGeometryUv(frontGeometry, width, height);
    mapGeometryUv(backGeometry, width, height);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    const loadingMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.55,
    });

    const frontMesh = new THREE.Mesh(frontGeometry, loadingMaterial.clone());
    const backMesh = new THREE.Mesh(backGeometry, loadingMaterial.clone());

    frontMesh.position.z = faceGap;
    backMesh.position.z = -faceGap;
    backMesh.rotation.y = Math.PI;

    group.add(frontMesh, backMesh);
    group.rotation.set(interaction.targetX, interaction.targetY, 0.02);
    scene.add(group);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.35);
    keyLight.position.set(1.8, 3.2, 4.5);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0xffffff, 1.18));

    const applyTexture = (url, mesh) => {
      textureLoader.load(url, (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.offset.set(artwork.crop.offsetX, artwork.crop.offsetY);
        texture.repeat.set(artwork.crop.repeatX, artwork.crop.repeatY);
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        const material = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.36,
          metalness: 0.05,
          side: THREE.DoubleSide,
        });
        mesh.material.dispose();
        mesh.material = material;
      });
    };

    applyTexture(artwork.front, frontMesh);
    applyTexture(artwork.back, backMesh);

    const resize = () => {
      const bounds = mount.getBoundingClientRect();
      const nextWidth = Math.max(compact ? 220 : 260, Math.floor(bounds.width));
      const nextHeight = Math.max(compact ? 190 : 240, Math.floor(bounds.height));
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight, false);
    };

    const setHoverTarget = (event) => {
      const bounds = mount.getBoundingClientRect();
      interaction.hoverX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      interaction.hoverY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };

    const onPointerDown = (event) => {
      interaction.dragging = true;
      interaction.lastX = event.clientX;
      interaction.lastY = event.clientY;
      mount.classList.add("is-dragging");
      mount.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event) => {
      setHoverTarget(event);
      if (!interaction.dragging) return;

      const deltaX = event.clientX - interaction.lastX;
      const deltaY = event.clientY - interaction.lastY;
      interaction.targetY += deltaX * 0.012;
      interaction.targetX = clamp(interaction.targetX + deltaY * 0.006, -0.5, 0.5);
      interaction.lastX = event.clientX;
      interaction.lastY = event.clientY;
    };

    const onPointerUp = (event) => {
      interaction.dragging = false;
      interaction.targetY = nearestCardFaceAngle(interaction.targetY);
      mount.classList.remove("is-dragging");
      mount.releasePointerCapture?.(event.pointerId);
    };

    const onPointerLeave = (event) => {
      interaction.hoverX = 0;
      interaction.hoverY = 0;
      if (interaction.dragging) onPointerUp(event);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    mount.addEventListener("pointerdown", onPointerDown);
    mount.addEventListener("pointermove", onPointerMove);
    mount.addEventListener("pointerup", onPointerUp);
    mount.addEventListener("pointercancel", onPointerUp);
    mount.addEventListener("pointerleave", onPointerLeave);
    resize();

    const animate = () => {
      frame = window.requestAnimationFrame(animate);
      const time = performance.now() * 0.001;
      const hoverTiltY = interaction.dragging ? 0 : interaction.hoverX * 0.18;
      const hoverTiltX = interaction.dragging ? 0 : -interaction.hoverY * 0.1;
      group.rotation.y += ((interaction.targetY + hoverTiltY + Math.sin(time * 0.28) * 0.04) - group.rotation.y) * 0.12;
      group.rotation.x += ((interaction.targetX + hoverTiltX) - group.rotation.x) * 0.12;
      group.rotation.z = Math.sin(time * 0.38) * 0.025;
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mount.removeEventListener("pointerdown", onPointerDown);
      mount.removeEventListener("pointermove", onPointerMove);
      mount.removeEventListener("pointerup", onPointerUp);
      mount.removeEventListener("pointercancel", onPointerUp);
      mount.removeEventListener("pointerleave", onPointerLeave);
      frontGeometry.dispose();
      backGeometry.dispose();
      frontMesh.material.map?.dispose();
      backMesh.material.map?.dispose();
      frontMesh.material.dispose();
      backMesh.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      mount.classList.remove("is-ready");
    };
  }, [artwork, compact, product?.name]);

  return (
    <div className={compact ? "shop-nfc-preview shop-nfc-preview--compact" : "shop-nfc-preview"}>
      <div ref={mountRef} className="shop-nfc-preview__scene">
        <span>Loading card preview</span>
      </div>
    </div>
  );
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
            Choose a card design, preview the front and back in 3D, then start your order directly from the dashboard.
          </p>

          <div className="shop-page__hero-meta">
            <span>
              <CheckCircle2 size={15} />
              {availableCount} available
            </span>
            <span>
              <Sparkles size={15} />
              3D previews included
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
                  href={soldOut ? undefined : product.checkoutPath || "/checkout?plan=jostap_nfc&billing=one_time"}
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
