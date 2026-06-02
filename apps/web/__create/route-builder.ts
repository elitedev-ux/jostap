import { Hono } from 'hono';
import type { Handler } from 'hono/types';
import updatedFetch from '../src/__create/fetch';

const API_BASENAME = '/api';
const api = new Hono();
if (globalThis.fetch) {
  globalThis.fetch = updatedFetch;
}

type RouteModule = Partial<Record<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH', Handler>>;
const routeModules = import.meta.glob('../src/app/api/**/route.js', { eager: true }) as Record<
  string,
  RouteModule
>;

// Helper function to transform file path to Hono route path
function getHonoPath(modulePath: string): { name: string; pattern: string }[] {
  const relativePath = modulePath
    .replace(/^(\.\.\/)?src\/app\/api\//, '')
    .replace(/^(\.\.\/)+/, '')
    .replace(/\/route\.js$/, '');
  const routeParts = relativePath ? relativePath.split('/').filter(Boolean) : [];
  if (routeParts.length === 0) {
    return [{ name: 'root', pattern: '' }];
  }
  const transformedParts = routeParts.map((segment) => {
    const match = segment.match(/^\[(\.{3})?([^\]]+)\]$/);
    if (match) {
      const [_, dots, param] = match;
      return dots === '...'
        ? { name: param, pattern: `:${param}{.+}` }
        : { name: param, pattern: `:${param}` };
    }
    return { name: segment, pattern: segment };
  });
  return transformedParts;
}

async function registerRoutes() {
  const routeEntries = Object.entries(routeModules)
    .slice()
    .sort(([a], [b]) => b.length - a.length);

  // Clear existing routes
  api.routes = [];

  for (const [modulePath, route] of routeEntries) {
    try {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      for (const method of methods) {
        try {
          if (route[method]) {
            const parts = getHonoPath(modulePath);
            const suffix = parts.map(({ pattern }) => pattern).join('/');
            const honoPath = suffix ? `/${suffix}` : '/';
            const handler: Handler = async (c) => {
              const params = c.req.param();
              return await route[method](c.req.raw, { params });
            };
            const methodLowercase = method.toLowerCase();
            switch (methodLowercase) {
              case 'get':
                api.get(honoPath, handler);
                break;
              case 'post':
                api.post(honoPath, handler);
                break;
              case 'put':
                api.put(honoPath, handler);
                break;
              case 'delete':
                api.delete(honoPath, handler);
                break;
              case 'patch':
                api.patch(honoPath, handler);
                break;
              default:
                console.warn(`Unsupported method: ${method}`);
                break;
            }
          }
        } catch (error) {
          console.error(`Error registering route ${modulePath} for method ${method}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error registering route module ${modulePath}:`, error);
    }
  }
}

// Initial route registration
await registerRoutes();

// Hot reload routes in development
if (import.meta.env.DEV) {
  if (import.meta.hot) {
    import.meta.hot.accept(() => {
      registerRoutes().catch((err) => {
        console.error('Error reloading routes:', err);
      });
    });
  }
}

export { api, API_BASENAME };
