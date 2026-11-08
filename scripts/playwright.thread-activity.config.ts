import { defineConfig } from '@playwright/test';
import { testBrowserLaunchOptions } from '../../../scripts/test-browser.mjs';

export default defineConfig({
  testDir: '../e2e', testMatch: 'thread-activity.pw.ts', workers: 1, timeout: 60_000, reporter: 'list',
  outputDir: '../../../.codex-tmp/thread-activity/playwright',
  use: { baseURL: 'http://127.0.0.1:1599/web/', locale: 'zh-CN', headless: true,
    launchOptions: testBrowserLaunchOptions(), screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { cwd: '..',
    command: 'npx vite --config scripts/vite.config.ts --host 127.0.0.1 --port 1599 --strictPort',
    url: 'http://127.0.0.1:1599/web/', reuseExistingServer: false, timeout: 120_000 },
});
