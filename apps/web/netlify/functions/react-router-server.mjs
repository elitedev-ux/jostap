let cachedApp;

async function getApp() {
  if (!cachedApp) {
    const serverEntryUrl = new URL('../../build/server/index.js', import.meta.url);
    const serverModule = await import(serverEntryUrl.href);
    cachedApp = serverModule.default;
  }

  return cachedApp;
}

export default async function handler(request, context) {
  const app = await getApp();

  if (typeof app === 'function') {
    return app(request, context?.env, context);
  }

  if (!app || typeof app.fetch !== 'function') {
    return new Response('App handler is unavailable.', { status: 500 });
  }

  return app.fetch(request, context?.env, context);
}

export const config = {
  name: 'JOSTAP server handler',
  path: '/*',
  excludedPath: ['/.netlify/*'],
  preferStatic: true,
};
