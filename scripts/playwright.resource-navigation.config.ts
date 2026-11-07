import { defineConfig } from '@playwright/test';
import { testBrowserLaunchOptions } from '../../../scripts/test-browser.mjs';

export default defineConfig({
  testDir: '../e2e', testMatch: 'resource-navigation.pw.ts', grep: /web (light|dark)/, workers: 1, timeout: 45_000,
  outputDir: '../../../.codex-tmp/resource-navigation-web',
  use: { baseURL: 'http://127.0.0.1:1570/web/', launchOptions: testBrowserLaunchOptions(), locale: 'zh-CN' },
  webServer: { cwd: '..',
    command: 'npx vite --config scripts/vite.config.ts --host 127.0.0.1 --port 1570 --strictPort',
    url: 'http://127.0.0.1:1570/web/', reuseExistingServer: true },
});
