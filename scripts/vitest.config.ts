import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import viteConfig from './vite.config';

export default defineConfig(environment => mergeConfig(viteConfig(environment), {
  // Standalone tests load shared fixtures beside the application root.
  server: { fs: { allow: [fileURLToPath(new URL('../../../', import.meta.url))] } },
  test: {
    setupFiles: ['../../shared/localization/testLocale.ts'],
    // The standalone workspace copies tooling too; Node's tests run separately before Vitest.
    exclude: [...configDefaults.exclude, 'scripts/**'],
  },
}));
