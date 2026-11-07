import { defineConfig } from '@playwright/test';
import { testBrowserLaunchOptions } from '../../../scripts/test-browser.mjs';

export default defineConfig({
  testDir: '../e2e', testMatch: 'process-history.pw.ts', workers: 1, timeout: 60_000,
  outputDir: '../../../.codex-tmp/process-history-results', reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:1438/web/', headless: true, locale: 'zh-CN',
    launchOptions: testBrowserLaunchOptions() },
  webServer: { cwd: '..', command: 'npx vite --config scripts/vite.config.ts --host 127.0.0.1 --port 1438 --strictPort',
    url: 'http://127.0.0.1:1438/web/', reuseExistingServer: true },
});
