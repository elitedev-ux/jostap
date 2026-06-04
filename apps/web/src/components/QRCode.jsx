import { useMemo } from "react";
import QR from "qrcode";

const DEFAULT_VALUE = "https://jostap.com";
const DEFAULT_DARK = "#000000";
const DEFAULT_LIGHT = "#ffffff";
const DEFAULT_MARGIN = 4;
const MIN_SCANNABLE_SIZE = 112;

function normalizeValue(value) {
  return String(value || DEFAULT_VALUE).trim() || DEFAULT_VALUE;
}

function createQr(value) {
  return QR.create(normalizeValue(value), {
    errorCorrectionLevel: "M",
    margin: DEFAULT_MARGIN,
  });
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function matrixFromQr(qr) {
  const size = qr.modules.size;
  const data = qr.modules.data;
  const rows = [];

  for (let y = 0; y < size; y += 1) {
    const row = [];
    for (let x = 0; x < size; x += 1) {
      row.push(Boolean(data[y * size + x]));
    }
    rows.push(row);
  }

  return rows;
}

export function qrSvgString(value, options = {}) {
  const {
    scale = 10,
    margin = DEFAULT_MARGIN,
    dark = DEFAULT_DARK,
    light = DEFAULT_LIGHT,
  } = options;
  const qr = createQr(value);
  const modules = matrixFromQr(qr);
  const moduleCount = qr.modules.size + margin * 2;
  const outer = moduleCount * scale;
  const cells = [];

  modules.forEach((row, y) => {
    row.forEach((active, x) => {
      if (!active) return;
      cells.push(
        `<rect x="${(x + margin) * scale}" y="${(y + margin) * scale}" width="${scale}" height="${scale}" fill="${escapeXml(dark)}"/>`,
      );
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${outer}" height="${outer}" viewBox="0 0 ${outer} ${outer}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="${escapeXml(light)}"/>${cells.join("")}</svg>`;
}

export function downloadQrSvg(value, filename = "qr-code") {
  const svg = qrSvgString(value, { scale: 12 });
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function QRCode({ value, size = 144, dark = DEFAULT_DARK, light = DEFAULT_LIGHT }) {
  const qr = useMemo(() => createQr(value), [value]);
  const modules = useMemo(() => matrixFromQr(qr), [qr]);
  const margin = DEFAULT_MARGIN;
  const moduleCount = qr.modules.size + margin * 2;
  const resolvedSize = Math.max(Number(size) || MIN_SCANNABLE_SIZE, MIN_SCANNABLE_SIZE);

  return (
    <svg
      width={resolvedSize}
      height={resolvedSize}
      viewBox={`0 0 ${moduleCount} ${moduleCount}`}
      role="img"
      aria-label={`QR code for ${normalizeValue(value)}`}
      shapeRendering="crispEdges"
      style={{
        display: "block",
        background: light,
        maxWidth: "100%",
        height: "auto",
      }}
    >
      <rect width={moduleCount} height={moduleCount} fill={light} />
      {modules.map((row, y) =>
        row.map((active, x) =>
          active ? (
            <rect
              key={`${x}-${y}`}
              x={x + margin}
              y={y + margin}
              width={1}
              height={1}
              fill={dark}
            />
          ) : null,
        ),
      )}
    </svg>
  );
}
