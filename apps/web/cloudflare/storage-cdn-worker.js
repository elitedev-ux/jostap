const PUBLIC_STORAGE_PREFIX = "/storage/v1/object/public/";
const DEFAULT_BROWSER_CACHE_SECONDS = 31536000;

function cleanOrigin(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function notFound() {
  return new Response("Not found", {
    status: 404,
    headers: {
      "Cache-Control": "public, max-age=60",
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", {
        status: 405,
        headers: { Allow: "GET, HEAD" },
      });
    }

    const supabaseOrigin = cleanOrigin(env.SUPABASE_ORIGIN);
    if (!supabaseOrigin) {
      return new Response("Storage origin is not configured.", { status: 500 });
    }

    const url = new URL(request.url);
    if (!url.pathname.startsWith(PUBLIC_STORAGE_PREFIX)) {
      return notFound();
    }

    const cache = caches.default;
    const cacheKey = new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
    });
    const cached = await cache.match(cacheKey);

    if (cached) {
      return cached;
    }

    const originUrl = new URL(`${url.pathname}${url.search}`, supabaseOrigin);
    const originResponse = await fetch(originUrl.toString(), {
      method: request.method,
      headers: {
        Accept: request.headers.get("Accept") || "*/*",
        "Accept-Encoding": request.headers.get("Accept-Encoding") || "br, gzip",
      },
    });

    if (!originResponse.ok) {
      return originResponse;
    }

    const response = new Response(originResponse.body, originResponse);
    response.headers.set(
      "Cache-Control",
      `public, max-age=${DEFAULT_BROWSER_CACHE_SECONDS}, s-maxage=${DEFAULT_BROWSER_CACHE_SECONDS}, immutable`,
    );
    response.headers.set("X-JOSTAP-CDN", "cloudflare-storage");

    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  },
};
