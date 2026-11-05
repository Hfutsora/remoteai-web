import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { normalizePath, type Plugin } from 'vite';

/** Resolve assets from the host's PDF.js installation, even when shared sources are copied elsewhere. */
export function pdfAssetsPlugin(): Plugin {
  return {
    name: 'pdf-assets',
    config(config) {
      const require = createRequire(resolve(config.root ?? '.', 'package.json'));
      const directory = dirname(require.resolve('pdfjs-dist/package.json'));
      return { resolve: { alias: { '@remoteai/pdfjs-assets': normalizePath(directory) } } };
    },
  };
}
