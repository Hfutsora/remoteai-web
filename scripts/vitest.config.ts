import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig(environment => mergeConfig(viteConfig(environment), {
  test: {
    setupFiles: ['../../shared/localization/testLocale.ts'],
    // The standalone workspace copies tooling too; Node's tests run separately before Vitest.
    exclude: [...configDefaults.exclude, 'scripts/**'],
  },
}));
