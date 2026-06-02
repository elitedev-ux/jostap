let cachedHandler;

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

export default async function handler(request, context) {
  const handler = await getHandler();
  const url = getAbsoluteRequestUrl(request);
  const originalPath = url.searchParams.get('path') || '';

  url.searchParams.delete('path');
  url.pathname = originalPath ? `/${originalPath}` : '/';

  return handler(new Request(url, request), context?.env, context);
}

export const config = {
  runtime: 'nodejs',
};
