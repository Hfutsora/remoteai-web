import { resolve } from 'node:path';
import { build, preview } from 'vite';

// Exercise production asset emission and a nested deployment base from the standalone workspace.
const base = '/pdf-test/web/';
const outDir = resolve('../../.codex-tmp/pdf-preview-build');
await build({ base, build: { outDir, emptyOutDir: true,
  rollupOptions: { input: resolve('e2e/pdf-assets-harness.html') } } });
const server = await preview({ base, build: { outDir },
  preview: { host: '127.0.0.1', port: 1518, strictPort: true } });
server.printUrls();
