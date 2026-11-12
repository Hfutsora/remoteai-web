import { defineConfig } from '@playwright/test';
import { testBrowserLaunchOptions } from '../../../scripts/test-browser.mjs';

export default defineConfig({
  testDir: '../e2e', testMatch: 'browser-bookmarks.pw.ts', workers: 1, timeout: 60_000,
  outputDir: '../../../.codex-tmp/browser-bookmarks-web',
  use: { baseURL: 'http://127.0.0.1:1579/web/', launchOptions: testBrowserLaunchOptions(), locale: 'zh-CN' },
  webServer: { cwd: '..', command: 'npx vite --config scripts/vite.config.ts --host 127.0.0.1 --port 1579 --strictPort',
    url: 'http://127.0.0.1:1579/web/', timeout: 120_000 },
});
