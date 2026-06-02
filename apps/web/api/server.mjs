import { Readable } from 'node:stream';

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

async function writeNodeResponse(response, nodeResponse) {
  nodeResponse.statusCode = response.status;
  nodeResponse.statusMessage = response.statusText;

  response.headers.forEach((value, key) => {
    nodeResponse.setHeader(key, value);
  });

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
  const appResponse = await handleRequest(request, {});
  await writeNodeResponse(appResponse, response);
}

export const config = {
  runtime: 'nodejs',
};
