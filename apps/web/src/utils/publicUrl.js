const DEFAULT_PUBLIC_ORIGIN = "https://jostap.vercel.app";

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
    env.VITE_PUBLIC_SITE_URL ||
    env.VITE_APP_ORIGIN ||
    (typeof process !== "undefined" && process.env
      ? process.env.PUBLIC_SITE_URL ||
        process.env.VITE_PUBLIC_SITE_URL ||
        process.env.APP_ORIGIN ||
        process.env.GOOGLE_REDIRECT_ORIGIN ||
        process.env.VERCEL_PROJECT_PRODUCTION_URL ||
        process.env.VERCEL_URL
      : "");

  return (
    cleanOrigin(options.origin) ||
    requestOrigin(options.request) ||
    cleanOrigin(fromEnv) ||
    (typeof window !== "undefined" ? cleanOrigin(window.location.origin) : "") ||
    DEFAULT_PUBLIC_ORIGIN
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

export function cardQrPath(slug) {
  const value =
    typeof slug === "object" && slug !== null
      ? trimSlashes(slug.id || slug.slug)
      : trimSlashes(slug);
  return value ? `/api/qr/${encodeURIComponent(value)}` : "/";
}

export function cardProfileUrl(slug, options = {}) {
  return absolutePublicUrl(cardProfilePath(slug), options);
}

export function cardQrUrl(slug, options = {}) {
  return absolutePublicUrl(cardQrPath(slug), options);
}

export function displayCardUrl(slug, options = {}) {
  const origin = publicOrigin(options).replace(/^https?:\/\//i, "");
  const value = trimSlashes(slug);
  return value ? `${origin}/${value}` : origin;
}
