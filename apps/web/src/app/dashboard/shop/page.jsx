import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Bell, MessageSquareText, QrCode, ShoppingBag, Tags, Watch, Wifi } from "lucide-react";
import lagosVibesBack from "../../../assets/Lagos Vibes Back.png";
import lagosVibesFront from "../../../assets/Lagos Vibes front.png";
import "./shop.css";

const products = [
  {
    title: "NFC Wristbands",
    copy: "Tap-to-share wristbands for events, teams, creators, and high-movement networking moments.",
    icon: Watch,
  },
  {
    title: "Smart NFC Wristbands",
    copy: "Advanced wristbands built for richer interactions, campaigns, and premium brand activations.",
    icon: Wifi,
  },
  {
    title: "Review / Feedback Tags",
    copy: "Simple tap points that help customers leave reviews, feedback, and follow-up details faster.",
    icon: MessageSquareText,
  },
  {
    title: "NFC Table Stands",
    copy: "Countertop sharing for restaurants, salons, events, offices, and front-desk experiences.",
    icon: QrCode,
  },
  {
    title: "Additional NFC Solutions",
    copy: "More smart tags, branded touchpoints, and custom NFC tools for growing businesses.",
    icon: Tags,
  },
];

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

const lagosVibesTextureCrop = {
  offsetX: 212 / 4000,
  offsetY: 232 / 3000,
  repeatX: 3405 / 4000,
  repeatY: 2337 / 3000,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function nearestCardFaceAngle(angle) {
  const fullTurn = Math.PI * 2;
  const normalized = ((angle % fullTurn) + fullTurn) % fullTurn;
  const faceAngle = normalized > Math.PI / 2 && normalized < Math.PI * 1.5 ? Math.PI : 0;
  let delta = faceAngle - normalized;

  if (delta > Math.PI) delta -= fullTurn;
  if (delta < -Math.PI) delta += fullTurn;

  return angle + delta;
}

function ShopNfcCardPreview() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const width = 3.4;
    const height = width * (lagosVibesTextureCrop.repeatY / lagosVibesTextureCrop.repeatX);
    const depth = 0.07;
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

    camera.position.set(0, 0, 6);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);
    mount.classList.add("is-ready");
    renderer.domElement.setAttribute("aria-label", "3D preview of Lagos Vibes NFC card");
    renderer.domElement.setAttribute("role", "img");

    const sideGeometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: 0.012,
      bevelSize: 0.018,
      bevelSegments: 2,
    });
    sideGeometry.center();

    const frontGeometry = new THREE.ShapeGeometry(shape);
    const backGeometry = new THREE.ShapeGeometry(shape);
    mapGeometryUv(frontGeometry, width, height);
    mapGeometryUv(backGeometry, width, height);

    const textureLoader = new THREE.TextureLoader();
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: 0x050505,
      roughness: 0.5,
      metalness: 0.12,
    });
    const capMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const loadingMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.55,
    });

    const sideMesh = new THREE.Mesh(sideGeometry, [capMaterial, sideMaterial]);
    const frontMesh = new THREE.Mesh(frontGeometry, loadingMaterial.clone());
    const backMesh = new THREE.Mesh(backGeometry, loadingMaterial.clone());

    frontMesh.position.z = depth / 2 + 0.035;
    backMesh.position.z = -(depth / 2 + 0.035);
    backMesh.rotation.y = Math.PI;

    group.add(sideMesh, frontMesh, backMesh);
    group.rotation.set(interaction.targetX, interaction.targetY, 0.02);
    scene.add(group);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(1.8, 3.2, 4.5);
    scene.add(keyLight);
    scene.add(new THREE.AmbientLight(0xffffff, 1.25));

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
        texture.offset.set(lagosVibesTextureCrop.offsetX, lagosVibesTextureCrop.offsetY);
        texture.repeat.set(lagosVibesTextureCrop.repeatX, lagosVibesTextureCrop.repeatY);
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

    applyTexture(lagosVibesFront, frontMesh);
    applyTexture(lagosVibesBack, backMesh);

    const resize = () => {
      const bounds = mount.getBoundingClientRect();
      const nextWidth = Math.max(260, Math.floor(bounds.width));
      const nextHeight = Math.max(240, Math.floor(bounds.height));
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
      sideGeometry.dispose();
      frontGeometry.dispose();
      backGeometry.dispose();
      sideMaterial.dispose();
      capMaterial.dispose();
      frontMesh.material.map?.dispose();
      backMesh.material.map?.dispose();
      frontMesh.material.dispose();
      backMesh.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
      mount.classList.remove("is-ready");
    };
  }, []);

  return (
    <div className="shop-nfc-preview">
      <div ref={mountRef} className="shop-nfc-preview__scene">
        <span>Loading Lagos Vibes card preview</span>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <div className="shop-coming-soon">
      <section className="shop-coming-soon__hero">
        <div className="shop-coming-soon__content">
          <span className="shop-coming-soon__eyebrow">
            <ShoppingBag size={15} />
            JOSTAP Shop
          </span>

          <h1>More NFC products are coming soon.</h1>
          <p>
            JOSTAP is expanding beyond NFC cards with wearable, tabletop,
            review, and custom NFC solutions designed for everyday business moments.
          </p>

          <div className="shop-coming-soon__actions">
            <button type="button" disabled>
              <Bell size={16} />
              Coming Soon
            </button>
            <span>Launch updates will appear in your dashboard.</span>
          </div>
        </div>

        <div className="shop-coming-soon__showcase">
          <ShopNfcCardPreview />
        </div>
      </section>

      <section className="shop-coming-soon__grid" aria-label="Upcoming shop products">
        {products.map(({ title, copy, icon: Icon }) => (
          <article className="shop-coming-soon__tile" key={title}>
            <div className="shop-coming-soon__tile-top">
              <span>
                <Icon size={18} />
              </span>
              <strong>Coming Soon</strong>
            </div>
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
