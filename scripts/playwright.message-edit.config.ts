import { defineConfig } from '@playwright/test';
import { testBrowserLaunchOptions } from '../../../scripts/test-browser.mjs';

export default defineConfig({
  testDir: '../e2e', testMatch: 'message-edit.pw.ts', workers: 1, timeout: 45_000,
  outputDir: '../../../.codex-tmp/message-edit-web',
  use: { launchOptions: testBrowserLaunchOptions(), baseURL: 'http://127.0.0.1:1527/web/',
    headless: true, locale: 'zh-CN', screenshot: 'only-on-failure' },
  webServer: { cwd: '..',
    command: 'npx vite --config scripts/vite.config.ts --host 127.0.0.1 --port 1527 --strictPort',
    url: 'http://127.0.0.1:1527/web/e2e/message-edit-harness.html', reuseExistingServer: !process.env.CI },
});
