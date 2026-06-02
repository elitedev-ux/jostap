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

export default async function handler(request, context) {
  const handler = await getHandler();
  const url = new URL(request.url);
  const originalPath = url.searchParams.get('path') || '';

  url.searchParams.delete('path');
  url.pathname = originalPath ? `/${originalPath}` : '/';

  return handler(new Request(url, request), context?.env, context);
}

export const config = {
  runtime: 'nodejs',
};
