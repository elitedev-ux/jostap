import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = dirname(scriptDir);
const outputFile = join(webRoot, 'build', 'server', 'server.js');

const source = `import app from "./index.js";

export default async function handler(request, context) {
  if (!app || typeof app.fetch !== "function") {
    return new Response("App handler is unavailable.", { status: 500 });
  }

  return app.fetch(request, context?.env, context);
}
`;

await mkdir(dirname(outputFile), { recursive: true });
await writeFile(outputFile, source, 'utf8');

console.log('[netlify] wrote build/server/server.js');
