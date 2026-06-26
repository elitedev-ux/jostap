const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);

function normalizeOrigin(value) {
  if (!value) return "";

  try {
    const rawValue = String(value).trim().replace(/\/$/, "");
    if (!rawValue) return "";

    const withProtocol = /^https?:\/\//i.test(rawValue)
      ? rawValue
      : `https://${rawValue}`;

    return new URL(withProtocol).origin;
  } catch {
    return "";
  }
}

function isLocalOrigin(origin) {
  try {
    return LOCAL_HOSTNAMES.has(new URL(origin).hostname.toLowerCase());
  } catch {
    return false;
  }
}

function requestOrigin(request) {
  try {
    return new URL(request.url).origin;
  } catch {
    return "";
  }
}

export function appOrigin(request) {
  const candidates = [
    process.env.GOOGLE_REDIRECT_ORIGIN,
    process.env.APP_ORIGIN,
    process.env.PUBLIC_SITE_URL,
    process.env.VITE_PUBLIC_SITE_URL,
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.DEPLOY_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    requestOrigin(request),
  ]
    .map(normalizeOrigin)
    .filter(Boolean);

  const uniqueCandidates = [...new Set(candidates)];

  if (process.env.NODE_ENV === "production") {
    const liveOrigin = uniqueCandidates.find((origin) => !isLocalOrigin(origin));
    if (liveOrigin) return liveOrigin;
  }

  return uniqueCandidates[0] || requestOrigin(request) || "http://localhost:4000";
}
