import { useMemo } from "react";

const VERSION = 5;
const SIZE = 21 + (VERSION - 1) * 4;
const DATA_CODEWORDS = 108;
const ECC_CODEWORDS = 26;
const ALIGNMENT_CENTERS = [6, 30];

function makeMatrix() {
  return {
    modules: Array.from({ length: SIZE }, () => Array(SIZE).fill(false)),
    reserved: Array.from({ length: SIZE }, () => Array(SIZE).fill(false)),
  };
}

function setModule(matrix, x, y, value, reserved = true) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  matrix.modules[y][x] = value;
  if (reserved) matrix.reserved[y][x] = true;
}

function addFinder(matrix, x, y) {
  for (let dy = -1; dy <= 7; dy += 1) {
    for (let dx = -1; dx <= 7; dx += 1) {
      const xx = x + dx;
      const yy = y + dy;
      const inPattern = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6;
      const dark =
        inPattern &&
        (dx === 0 ||
          dx === 6 ||
          dy === 0 ||
          dy === 6 ||
          (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4));
      setModule(matrix, xx, yy, dark, true);
    }
  }
}

function addAlignment(matrix, cx, cy) {
  for (let dy = -2; dy <= 2; dy += 1) {
    for (let dx = -2; dx <= 2; dx += 1) {
      const dist = Math.max(Math.abs(dx), Math.abs(dy));
      setModule(matrix, cx + dx, cy + dy, dist !== 1, true);
    }
  }
}

function addFunctionPatterns(matrix) {
  addFinder(matrix, 0, 0);
  addFinder(matrix, SIZE - 7, 0);
  addFinder(matrix, 0, SIZE - 7);

  for (let i = 8; i < SIZE - 8; i += 1) {
    setModule(matrix, i, 6, i % 2 === 0, true);
    setModule(matrix, 6, i, i % 2 === 0, true);
  }

  for (const y of ALIGNMENT_CENTERS) {
    for (const x of ALIGNMENT_CENTERS) {
      const nearTop = y === 6 && (x === 6 || x === SIZE - 7);
      const nearBottomLeft = x === 6 && y === SIZE - 7;
      if (!nearTop && !nearBottomLeft) addAlignment(matrix, x, y);
    }
  }

  setModule(matrix, 8, 4 * VERSION + 9, true, true);

  for (let i = 0; i < 9; i += 1) {
    if (i !== 6) {
      matrix.reserved[8][i] = true;
      matrix.reserved[i][8] = true;
    }
  }
  for (let i = 0; i < 8; i += 1) {
    matrix.reserved[8][SIZE - 1 - i] = true;
    matrix.reserved[SIZE - 1 - i][8] = true;
  }
}

function appendBits(bits, value, length) {
  for (let i = length - 1; i >= 0; i -= 1) {
    bits.push(((value >>> i) & 1) === 1);
  }
}

function bytesFromText(text) {
  if (typeof TextEncoder !== "undefined") {
    return Array.from(new TextEncoder().encode(text));
  }
  return Array.from(unescape(encodeURIComponent(text))).map((char) => char.charCodeAt(0));
}

function makeDataCodewords(text) {
  const bytes = bytesFromText(text).slice(0, 106);
  const bits = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bits, byte, 8));

  const capacity = DATA_CODEWORDS * 8;
  appendBits(bits, 0, Math.min(4, capacity - bits.length));
  while (bits.length % 8 !== 0) bits.push(false);

  const words = [];
  for (let i = 0; i < bits.length; i += 8) {
    let word = 0;
    for (let j = 0; j < 8; j += 1) word = (word << 1) | (bits[i + j] ? 1 : 0);
    words.push(word);
  }
  for (let pad = 0; words.length < DATA_CODEWORDS; pad += 1) {
    words.push(pad % 2 === 0 ? 0xec : 0x11);
  }
  return words;
}

function gfMultiply(x, y) {
  let result = 0;
  for (let i = 0; i < 8; i += 1) {
    if ((y & 1) !== 0) result ^= x;
    const carry = (x & 0x80) !== 0;
    x = (x << 1) & 0xff;
    if (carry) x ^= 0x1d;
    y >>>= 1;
  }
  return result;
}

function gfPow(power) {
  let value = 1;
  for (let i = 0; i < power; i += 1) value = gfMultiply(value, 2);
  return value;
}

function makeGenerator(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = Array(poly.length + 1).fill(0);
    poly.forEach((coef, index) => {
      next[index] ^= gfMultiply(coef, gfPow(i));
      next[index + 1] ^= coef;
    });
    poly = next;
  }
  return poly.slice(1);
}

function makeErrorCorrection(data) {
  const generator = makeGenerator(ECC_CODEWORDS);
  const result = Array(ECC_CODEWORDS).fill(0);
  for (const word of data) {
    const factor = word ^ result.shift();
    result.push(0);
    generator.forEach((coef, index) => {
      result[index] ^= gfMultiply(coef, factor);
    });
  }
  return result;
}

function maskApplies(x, y) {
  return (x + y) % 2 === 0;
}

function placeCodewords(matrix, codewords) {
  const bits = [];
  codewords.forEach((word) => appendBits(bits, word, 8));

  let bitIndex = 0;
  let direction = -1;
  let y = SIZE - 1;
  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right -= 1;
    while (y >= 0 && y < SIZE) {
      for (let col = 0; col < 2; col += 1) {
        const x = right - col;
        if (!matrix.reserved[y][x]) {
          const bit = bitIndex < bits.length ? bits[bitIndex] : false;
          matrix.modules[y][x] = bit !== maskApplies(x, y);
          bitIndex += 1;
        }
      }
      y += direction;
    }
    direction = -direction;
    y += direction;
  }
}

function makeFormatBits() {
  let data = 0b01000;
  let value = data << 10;
  const generator = 0b10100110111;
  for (let i = 14; i >= 10; i -= 1) {
    if (((value >>> i) & 1) !== 0) value ^= generator << (i - 10);
  }
  return ((data << 10) | value) ^ 0b101010000010010;
}

function addFormatBits(matrix) {
  const bits = makeFormatBits();
  const first = [
    [8, 0],
    [8, 1],
    [8, 2],
    [8, 3],
    [8, 4],
    [8, 5],
    [8, 7],
    [8, 8],
    [7, 8],
    [5, 8],
    [4, 8],
    [3, 8],
    [2, 8],
    [1, 8],
    [0, 8],
  ];
  const second = [
    [SIZE - 1, 8],
    [SIZE - 2, 8],
    [SIZE - 3, 8],
    [SIZE - 4, 8],
    [SIZE - 5, 8],
    [SIZE - 6, 8],
    [SIZE - 7, 8],
    [8, SIZE - 8],
    [8, SIZE - 7],
    [8, SIZE - 6],
    [8, SIZE - 5],
    [8, SIZE - 4],
    [8, SIZE - 3],
    [8, SIZE - 2],
    [8, SIZE - 1],
  ];
  first.forEach(([x, y], index) => setModule(matrix, x, y, ((bits >>> index) & 1) !== 0, true));
  second.forEach(([x, y], index) => setModule(matrix, x, y, ((bits >>> index) & 1) !== 0, true));
}

export function makeQrMatrix(value) {
  const matrix = makeMatrix();
  addFunctionPatterns(matrix);
  const data = makeDataCodewords(value || "");
  const ec = makeErrorCorrection(data);
  placeCodewords(matrix, [...data, ...ec]);
  addFormatBits(matrix);
  return matrix.modules;
}

export function qrSvgString(value, options = {}) {
  const { scale = 6, margin = 4, dark = "#111827", light = "#ffffff" } = options;
  const modules = makeQrMatrix(value);
  const outer = (SIZE + margin * 2) * scale;
  const cells = [];
  modules.forEach((row, y) => {
    row.forEach((active, x) => {
      if (active) {
        cells.push(
          `<rect x="${(x + margin) * scale}" y="${(y + margin) * scale}" width="${scale}" height="${scale}" fill="${dark}"/>`,
        );
      }
    });
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${outer}" height="${outer}" viewBox="0 0 ${outer} ${outer}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="${light}"/>${cells.join("")}</svg>`;
}

export function downloadQrSvg(value, filename = "qr-code") {
  const svg = qrSvgString(value, { scale: 8 });
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function QRCode({ value, size = 72, dark = "#111827", light = "#fff" }) {
  const modules = useMemo(() => makeQrMatrix(value || ""), [value]);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label="QR code"
      shapeRendering="crispEdges"
      style={{ display: "block", background: light }}
    >
      <rect width={SIZE} height={SIZE} fill={light} />
      {modules.map((row, y) =>
        row.map((active, x) =>
          active ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={dark} /> : null,
        ),
      )}
    </svg>
  );
}
