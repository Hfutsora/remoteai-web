import { defineConfig } from '@playwright/test';
import { testBrowserLaunchOptions } from '../../../scripts/test-browser.mjs';

export default defineConfig({
  testDir: '../e2e', testMatch: '**/nested-scroll.pw.ts', workers: 1, timeout: 45_000,
  outputDir: '../../../.codex-tmp/nested-scroll-web',
  use: { launchOptions: testBrowserLaunchOptions(), baseURL: 'http://127.0.0.1:1563/web/',
    locale: 'zh-CN', headless: true, screenshot: 'only-on-failure' },
  webServer: { cwd: '..',
    command: 'npx vite --config scripts/vite.config.ts --host 127.0.0.1 --port 1563 --strictPort',
    url: 'http://127.0.0.1:1563/web/', reuseExistingServer: !process.env.CI },
});
