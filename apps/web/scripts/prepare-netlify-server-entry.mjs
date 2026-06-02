import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const webRoot = dirname(scriptDir);
const outputFile = join(webRoot, 'build', 'server', 'server.js');

const source = `import { createRequestHandler } from "@netlify/vite-plugin-react-router/serverless";
import * as build from "./assets/server-build.js";

export default createRequestHandler({
  build,
});
`;

await mkdir(dirname(outputFile), { recursive: true });
await writeFile(outputFile, source, 'utf8');

console.log('[netlify] wrote build/server/server.js');
