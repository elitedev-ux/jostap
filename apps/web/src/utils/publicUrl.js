const DEFAULT_PUBLIC_ORIGIN = "https://jostap.com";

function trimSlashes(value) {
  return String(value || "").replace(/^\/+|\/+$/g, "");
}

function cleanOrigin(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;

  try {
    const url = new URL(withProtocol);
    return url.origin;
  } catch {
    return "";
  }
}

function requestOrigin(request) {
  const headers = request?.headers;
  const host = headers?.get?.("x-forwarded-host") || headers?.get?.("host");
  if (!host) return "";
  const protocol = headers?.get?.("x-forwarded-proto") || (String(host).includes("localhost") ? "http" : "https");
  return cleanOrigin(`${protocol}://${host}`);
}

export function publicOrigin(options = {}) {
  const env = typeof import.meta !== "undefined" ? import.meta.env || {} : {};
  const fromEnv =
    env.NEXT_PUBLIC_APP_URL ||
    env.VITE_PUBLIC_SITE_URL ||
    env.VITE_APP_ORIGIN ||
    (typeof process !== "undefined" && process.env
      ? process.env.NEXT_PUBLIC_APP_URL ||
        process.env.PUBLIC_SITE_URL ||
        process.env.VITE_PUBLIC_SITE_URL ||
        process.env.APP_ORIGIN
      : "");

  return (
    cleanOrigin(options.origin) ||
    cleanOrigin(fromEnv) ||
    DEFAULT_PUBLIC_ORIGIN ||
    (typeof window !== "undefined" ? cleanOrigin(window.location.origin) : "") ||
    requestOrigin(options.request)
  );
}

export function absolutePublicUrl(path = "/", options = {}) {
  const origin = publicOrigin(options);
  const normalizedPath = String(path || "/").startsWith("/") ? String(path || "/") : `/${path}`;
  return `${origin}${normalizedPath}`;
}

export function cardProfilePath(slug) {
  const value = trimSlashes(slug);
  return value ? `/${encodeURIComponent(value)}` : "/";
}

export function publicCardPath(card) {
  const value =
    typeof card === "object" && card !== null
      ? trimSlashes(card.id)
      : trimSlashes(card);
  return value ? `/public/card/${encodeURIComponent(value)}` : "/";
}

export function publicCardUrl(card, options = {}) {
  return absolutePublicUrl(publicCardPath(card), options);
}

export function cardQrPath(card) {
  const path = publicCardPath(card);
  return path === "/" ? path : `${path}?source=qr`;
}

export function cardNfcPath(card) {
  const path = publicCardPath(card);
  return path === "/" ? path : `${path}?source=nfc`;
}

export function cardProfileUrl(slug, options = {}) {
  return absolutePublicUrl(cardProfilePath(slug), options);
}

export function cardQrUrl(card, options = {}) {
  return absolutePublicUrl(cardQrPath(card), options);
}

export function cardNfcUrl(card, options = {}) {
  return absolutePublicUrl(cardNfcPath(card), options);
}

export function displayCardUrl(slug, options = {}) {
  const origin = publicOrigin(options).replace(/^https?:\/\//i, "");
  const value = trimSlashes(slug);
  return value ? `${origin}/${value}` : origin;
}
