import { defineConfig, mergeConfig } from 'vite';
import base from '../scripts/vite.config';

export default defineConfig(environment => mergeConfig(base(environment), {
  cacheDir: '../../.codex-tmp/token-lifecycle/web-cache',
  optimizeDeps: { entries: ['index.html'] },
  server: { hmr: false, watch: { ignored: ['**'] } },
}));
