import { rm } from 'node:fs/promises';
import { join } from 'node:path';

const stalePaths = [
  join(process.cwd(), '.netlify'),
  join(process.cwd(), 'build', 'server', 'server.js'),
];

for (const target of stalePaths) {
  await rm(target, { recursive: true, force: true });
}

console.log('[netlify] removed stale generated function artifacts');
