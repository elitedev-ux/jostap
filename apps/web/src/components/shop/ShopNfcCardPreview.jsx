import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import lagosVibesBack from "../../assets/Lagos Vibes Back.png";
import lagosVibesFront from "../../assets/Lagos Vibes front.png";

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

const CUSTOM_ARTWORK_CANVAS_WIDTH = 2048;

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

function isTrimmedAwayPixel(data, index) {
  const red = data[index];
  const green = data[index + 1];
  const blue = data[index + 2];
  const alpha = data[index + 3];
  const brightest = Math.max(red, green, blue);
  const darkest = Math.min(red, green, blue);
  const isNeutral = brightest - darkest < 28;
  const isWhiteBorder = red > 242 && green > 242 && blue > 242 && isNeutral;
  const isBlackBorder = brightest < 38 && isNeutral;

  return alpha < 24 || isWhiteBorder || isBlackBorder;
}

function detectArtworkBounds(image) {
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const maxAnalysisSize = 720;
  const scale = Math.min(1, maxAnalysisSize / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    return { x: 0, y: 0, width: sourceWidth, height: sourceHeight };
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  const pixels = context.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      if (!isTrimmedAwayPixel(pixels, index)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { x: 0, y: 0, width: sourceWidth, height: sourceHeight };
  }

  return {
    x: Math.round(minX / scale),
    y: Math.round(minY / scale),
    width: Math.max(1, Math.round((maxX - minX + 1) / scale)),
    height: Math.max(1, Math.round((maxY - minY + 1) / scale)),
  };
}

function cropBoundsToAspect(bounds, targetAspect) {
  const next = { ...bounds };
  const boundsAspect = next.width / next.height;

  if (Math.abs(boundsAspect - targetAspect) < 0.01) {
    return next;
  }

  if (boundsAspect > targetAspect) {
    const width = next.height * targetAspect;
    next.x += (next.width - width) / 2;
    next.width = width;
  } else {
    const height = next.width / targetAspect;
    next.y += (next.height - height) / 2;
    next.height = height;
  }

  return next;
}

function trimmedArtworkTexture(image, targetAspect) {
  const sourceBounds = detectArtworkBounds(image);
  const bounds = cropBoundsToAspect(sourceBounds, targetAspect);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const width = CUSTOM_ARTWORK_CANVAS_WIDTH;
  const height = Math.round(width / targetAspect);

  if (!context) {
    throw new Error("Canvas is unavailable.");
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, width, height);

  return new THREE.CanvasTexture(canvas);
}

function artworkForProduct(product) {
  const builtIn = BUILT_IN_ARTWORK[product?.artworkKey] || BUILT_IN_ARTWORK.lagos_vibes;
  const hasCustomArtwork = product?.frontImageUrl && product?.backImageUrl;

  return {
    front: hasCustomArtwork ? product.frontImageUrl : builtIn.front,
    back: hasCustomArtwork ? product.backImageUrl : builtIn.back,
    crop: hasCustomArtwork ? FULL_ARTWORK_CROP : builtIn.crop,
    autoTrim: Boolean(hasCustomArtwork),
  };
}

export default function ShopNfcCardPreview({ product, compact = false }) {
  const mountRef = useRef(null);
  const artwork = useMemo(() => artworkForProduct(product), [
    product?.artworkKey,
    product?.frontImageUrl,
    product?.backImageUrl,
  ]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const width = 3.4;
    const height = width / (artwork.crop.width / artwork.crop.height);
    const faceGap = 0;
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
    let loadedFaces = 0;
    let disposed = false;

    camera.position.set(0, 0, compact ? 5.55 : 5.15);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-label", `Preview of ${product?.name || "NFC card"}`);
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

    const markFaceReady = () => {
      loadedFaces += 1;
      if (loadedFaces >= 2) {
        mount.classList.add("is-ready");
      }
    };

    const applyTexture = (url, mesh, side) => {
      textureLoader.load(url, (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }
        let nextTexture = texture;
        if (artwork.autoTrim) {
          try {
            nextTexture = trimmedArtworkTexture(texture.image, artwork.crop.width / artwork.crop.height);
            texture.dispose();
          } catch {
            nextTexture = texture;
          }
        }
        nextTexture.colorSpace = THREE.SRGBColorSpace;
        nextTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        nextTexture.wrapS = THREE.ClampToEdgeWrapping;
        nextTexture.wrapT = THREE.ClampToEdgeWrapping;
        nextTexture.offset.set(artwork.autoTrim ? 0 : artwork.crop.offsetX, artwork.autoTrim ? 0 : artwork.crop.offsetY);
        nextTexture.repeat.set(artwork.autoTrim ? 1 : artwork.crop.repeatX, artwork.autoTrim ? 1 : artwork.crop.repeatY);
        nextTexture.minFilter = THREE.LinearMipmapLinearFilter;
        nextTexture.magFilter = THREE.LinearFilter;
        nextTexture.needsUpdate = true;
        const material = new THREE.MeshStandardMaterial({
          map: nextTexture,
          roughness: 0.36,
          metalness: 0.05,
          side,
        });
        mesh.material.dispose();
        mesh.material = material;
        markFaceReady();
      }, undefined, () => {
        if (disposed) return;
        markFaceReady();
      });
    };

    applyTexture(artwork.front, frontMesh, THREE.FrontSide);
    applyTexture(artwork.back, backMesh, THREE.FrontSide);

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
