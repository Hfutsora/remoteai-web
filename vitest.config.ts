import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default defineConfig(environment => mergeConfig(viteConfig(environment), {
  test: { setupFiles: ['../../shared/localization/testLocale.ts'] },
}));
