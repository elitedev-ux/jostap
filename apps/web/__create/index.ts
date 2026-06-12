import { AsyncLocalStorage } from 'node:async_hooks';
import nodeConsole from 'node:console';
import { Hono } from 'hono';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { proxy } from 'hono/proxy';
import { bodyLimit } from 'hono/body-limit';
import { requestId } from 'hono/request-id';
import { createMiddleware } from 'hono/factory';
import { createHonoServer } from 'react-router-hono-server/node';
import { createRequestHandler } from 'react-router';
import { serializeError } from 'serialize-error';
import { getHTMLForErrorPage } from './get-html-for-error-page';
import { API_BASENAME, api } from './route-builder';

const als = new AsyncLocalStorage<{ requestId: string }>();
const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const securityHeaders: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline' https:",
    "script-src 'self'",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
    "form-action 'self'",
    'upgrade-insecure-requests',
  ].join('; '),
};

const sensitiveRateLimits = [
  { method: 'POST', pattern: /^\/api\/auth\/signin$/, limit: 8, windowMs: 60_000 },
  { method: 'POST', pattern: /^\/api\/auth\/signup$/, limit: 6, windowMs: 60_000 },
  { method: 'POST', pattern: /^\/api\/auth\/resend-otp$/, limit: 4, windowMs: 60_000 },
  { method: 'POST', pattern: /^\/api\/auth\/verify-registration$/, limit: 8, windowMs: 60_000 },
  { method: 'POST', pattern: /^\/api\/auth\/2fa\/verify$/, limit: 8, windowMs: 60_000 },
  { method: 'POST', pattern: /^\/api\/appointments\/public\/[^/]+$/, limit: 6, windowMs: 60_000 },
  { method: 'POST', pattern: /^\/api\/support(?:\/[^/]+\/messages)?$/, limit: 12, windowMs: 60_000 },
  { method: 'POST', pattern: /^\/api\/account\/avatar$/, limit: 8, windowMs: 60_000 },
  { method: 'POST', pattern: /^\/api\/cards$/, limit: 12, windowMs: 60_000 },
  { method: 'GET', pattern: /^\/api\/qr\/[^/]+$/, limit: 120, windowMs: 60_000 },
];

function cleanOrigin(value: string | undefined) {
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

function requestOrigin(c: { req: { header: (name: string) => string | undefined } }) {
  const host = c.req.header('x-forwarded-host') || c.req.header('host') || '';
  const protocol =
    c.req.header('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return cleanOrigin(host ? `${protocol}://${host}` : '');
}

function clientIp(c: { req: { header: (name: string) => string | undefined } }) {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    c.req.header('x-real-ip') ||
    'unknown'
  );
}

function rateLimitFor(method: string, path: string) {
  return sensitiveRateLimits.find(
    (limit) => limit.method === method.toUpperCase() && limit.pattern.test(path)
  );
}

function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  current.count += 1;

  if (current.count > limit) {
    return Math.ceil((current.resetAt - now) / 1000);
  }

  return null;
}

function isAllowedMutationOrigin(c: {
  req: {
    header: (name: string) => string | undefined;
    method: string;
  };
}) {
  if (!unsafeMethods.has(c.req.method.toUpperCase())) return true;

  const origin = cleanOrigin(c.req.header('origin'));
  if (!origin) return true;

  const sameOrigin = requestOrigin(c);
  const allowed = new Set([sameOrigin, ...allowedOriginsFromEnv()].filter(Boolean));
  return allowed.has(origin);
}

for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
  const original = nodeConsole[method].bind(console);

  console[method] = (...args: unknown[]) => {
    const requestId = als.getStore()?.requestId;
    if (requestId) {
      original(`[traceId:${requestId}]`, ...args);
    } else {
      original(...args);
    }
  };
}

const app = new Hono();

app.use('*', requestId());

app.use('*', (c, next) => {
  const requestId = c.get('requestId');
  return als.run({ requestId }, () => next());
});

app.use('*', async (c, next) => {
  for (const [header, value] of Object.entries(securityHeaders)) {
    c.header(header, value);
  }

  if (process.env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  if (!isAllowedMutationOrigin(c)) {
    return c.json({ error: 'Request origin is not allowed.' }, 403);
  }

  const limit = rateLimitFor(c.req.method, c.req.path);
  if (limit) {
    const retryAfter = checkRateLimit(
      `${clientIp(c)}:${limit.method}:${limit.pattern.source}`,
      limit.limit,
      limit.windowMs
    );

    if (retryAfter !== null) {
      c.header('Retry-After', String(retryAfter));
      return c.json({ error: 'Too many requests. Please try again shortly.' }, 429);
    }
  }

  await next();
});

app.use(contextStorage());

app.onError((err, c) => {
  if (c.req.method !== 'GET') {
    const body =
      process.env.NODE_ENV === 'production'
        ? { error: 'An unexpected server error occurred.' }
        : {
            error: 'An error occurred in your app',
            details: serializeError(err),
          };

    return c.json(
      body,
      500
    );
  }
  return c.html(getHTMLForErrorPage(err), 200);
});

if (process.env.CORS_ORIGINS) {
  app.use(
    '/*',
    cors({
      origin: process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
    })
  );
}
for (const method of ['post', 'put', 'patch'] as const) {
  app[method](
    '*',
    bodyLimit({
      maxSize: 4.5 * 1024 * 1024,
      onError: (c) => {
        return c.json({ error: 'Body size limit exceeded' }, 413);
      },
    })
  );
}

app.all('/integrations/:path{.+}', async (c, next) => {
  const queryParams = c.req.query();
  const url = `${process.env.NEXT_PUBLIC_CREATE_BASE_URL ?? 'https://www.create.xyz'}/integrations/${c.req.param('path')}${Object.keys(queryParams).length > 0 ? `?${new URLSearchParams(queryParams).toString()}` : ''}`;

  return proxy(url, {
    method: c.req.method,
    body: c.req.raw.body ?? null,
    // @ts-expect-error -- duplex is accepted by the runtime even though the
    // type declarations don't include it; required for streaming integrations
    duplex: 'half',
    redirect: 'manual',
    headers: {
      ...c.req.header(),
      'X-Forwarded-For': process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-host': process.env.NEXT_PUBLIC_CREATE_HOST,
      Host: process.env.NEXT_PUBLIC_CREATE_HOST,
      'x-createxyz-project-group-id': process.env.NEXT_PUBLIC_PROJECT_GROUP_ID,
    },
  });
});

app.route(API_BASENAME, api);

const shouldBootNodeServer = !process.env.NETLIFY && !process.env.VERCEL;
const serverlessBasename = '/';

if (!shouldBootNodeServer) {
  const build = await import('virtual:react-router/server-build');
  const reactRouterApp = new Hono({ strict: false });
  reactRouterApp.use((c, next) => {
    return createMiddleware(async (routerContext) => {
      const requestHandler = createRequestHandler(build, 'production');
      return requestHandler(routerContext.req.raw, undefined);
    })(c, next);
  });

  app.route(serverlessBasename, reactRouterApp);
  app.route(`${serverlessBasename}.data`, reactRouterApp);
}

export default shouldBootNodeServer
  ? await createHonoServer({
      app,
      defaultLogger: false,
    })
  : app.fetch;
