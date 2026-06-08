import { json } from "./http.js";

const store = globalThis.__jostapRateLimitStore || new Map();
globalThis.__jostapRateLimitStore = store;

function clientIp(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    forwarded?.split(",")[0]?.trim() ||
    "unknown"
  );
}

function clearExpired(now) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

export function rateLimit(request, { key, limit = 5, windowMs = 60_000 }) {
  const now = Date.now();
  clearExpired(now);

  const identity = key || clientIp(request);
  const entry = store.get(identity);

  if (!entry || entry.resetAt <= now) {
    store.set(identity, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count += 1;
  if (entry.count <= limit) return null;

  const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
  return json(
    { error: "Too many requests. Please wait a moment and try again." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
      },
    },
  );
}

export function rateLimitKey(request, scope, parts = []) {
  return [scope, clientIp(request), ...parts.map((part) => String(part || "").toLowerCase())].join(":");
}

export function authRateLimit(request, scope, identifier, options = {}) {
  return rateLimit(request, {
    limit: options.limit ?? 8,
    windowMs: options.windowMs ?? 15 * 60_000,
    key: rateLimitKey(request, scope, [identifier]),
  });
}
