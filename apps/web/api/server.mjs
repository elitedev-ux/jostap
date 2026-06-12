import { Readable } from 'node:stream';

let cachedHandler;

const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https:",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; '),
};

async function getHandler() {
  if (!cachedHandler) {
    const serverEntryUrl = new URL('../build/server/index.js', import.meta.url);
    const serverModule = await import(serverEntryUrl.href);
    const app = serverModule.default;

    cachedHandler = typeof app === 'function' ? app : app.fetch.bind(app);
  }

  return cachedHandler;
}

function getAbsoluteRequestUrl(request) {
  try {
    return new URL(request.url);
  } catch {
    const headers = request.headers;
    const host =
      headers?.get?.('x-forwarded-host') ||
      headers?.get?.('host') ||
      process.env.VERCEL_URL ||
      'localhost';
    const protocol =
      headers?.get?.('x-forwarded-proto') ||
      (host.includes('localhost') ? 'http' : 'https');

    return new URL(request.url || '/', `${protocol}://${host}`);
  }
}

function getNodeRequestUrl(request) {
  const headers = request.headers;
  const host =
    headers?.['x-forwarded-host'] ||
    headers?.host ||
    process.env.VERCEL_URL ||
    'localhost';
  const protocol =
    headers?.['x-forwarded-proto'] ||
    (String(host).includes('localhost') ? 'http' : 'https');

  return new URL(request.url || '/', `${protocol}://${host}`);
}

function cleanOrigin(value) {
  if (!value) return '';
  try {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    return new URL(withProtocol).origin;
  } catch {
    return '';
  }
}

function allowedOriginsFromEnv() {
  return [
    process.env.PUBLIC_SITE_URL,
    process.env.VITE_PUBLIC_SITE_URL,
    process.env.APP_ORIGIN,
    process.env.GOOGLE_REDIRECT_ORIGIN,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
    ...(process.env.CORS_ORIGINS?.split(',') ?? []),
  ]
    .map((origin) => cleanOrigin(origin?.trim()))
    .filter(Boolean);
}

function requestOriginFromNodeRequest(request) {
  const url = getNodeRequestUrl(request);
  return cleanOrigin(url.origin);
}

function isAllowedMutationOrigin(request) {
  const method = String(request.method || 'GET').toUpperCase();
  if (!unsafeMethods.has(method)) return true;

  const origin = cleanOrigin(request.headers?.origin);
  if (!origin) return true;

  const allowed = new Set([
    requestOriginFromNodeRequest(request),
    ...allowedOriginsFromEnv(),
  ].filter(Boolean));

  return allowed.has(origin);
}

function headersFromNodeRequest(request) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(request.headers || {})) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else if (value !== undefined) {
      headers.set(key, value);
    }
  }

  return headers;
}

function toFetchRequest(request) {
  if (typeof Request !== 'undefined' && request instanceof Request) {
    return request;
  }

  const url = getNodeRequestUrl(request);
  const init = {
    method: request.method || 'GET',
    headers: headersFromNodeRequest(request),
  };

  if (!['GET', 'HEAD'].includes(init.method.toUpperCase())) {
    init.body = request;
    init.duplex = 'half';
  }

  return new Request(url, init);
}

function splitSetCookieHeader(value) {
  if (!value) return [];
  return String(value).split(/,\s*(?=[^=;,]+=)/);
}

function getSetCookieHeaders(headers) {
  if (typeof headers.getSetCookie === 'function') {
    return headers.getSetCookie();
  }

  return splitSetCookieHeader(headers.get('set-cookie'));
}

async function writeNodeResponse(response, nodeResponse) {
  nodeResponse.statusCode = response.status;
  nodeResponse.statusMessage = response.statusText;

  for (const [key, value] of Object.entries(securityHeaders)) {
    if (!response.headers.has(key)) {
      nodeResponse.setHeader(key, value);
    }
  }

  if (process.env.NODE_ENV === 'production' && !response.headers.has('Strict-Transport-Security')) {
    nodeResponse.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      return;
    }

    nodeResponse.setHeader(key, value);
  });

  const setCookies = getSetCookieHeaders(response.headers);
  if (setCookies.length > 0) {
    nodeResponse.setHeader('Set-Cookie', setCookies);
  }

  if (!response.body) {
    nodeResponse.end();
    return;
  }

  await new Promise((resolve, reject) => {
    const stream = Readable.fromWeb(response.body);
    stream.on('error', reject);
    nodeResponse.on('finish', resolve);
    nodeResponse.on('error', reject);
    stream.pipe(nodeResponse);
  });
}

async function handleRequest(request, context) {
  const handler = await getHandler();
  const fetchRequest = toFetchRequest(request);
  const url = getAbsoluteRequestUrl(fetchRequest);
  const originalPath = url.searchParams.get('path') || '';

  url.searchParams.delete('path');
  url.pathname = originalPath ? `/${originalPath}` : '/';

  return handler(new Request(url, fetchRequest), context?.env, context);
}

export default async function handler(request, response) {
  if (!isAllowedMutationOrigin(request)) {
    await writeNodeResponse(
      Response.json({ error: 'Request origin is not allowed.' }, { status: 403 }),
      response,
    );
    return;
  }

  const appResponse = await handleRequest(request, {});
  await writeNodeResponse(appResponse, response);
}

export const config = {
  runtime: 'nodejs',
};
