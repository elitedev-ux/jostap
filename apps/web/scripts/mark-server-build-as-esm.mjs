import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('build/server', { recursive: true });
await writeFile('build/server/package.json', `${JSON.stringify({ type: 'module' }, null, 2)}\n`);
