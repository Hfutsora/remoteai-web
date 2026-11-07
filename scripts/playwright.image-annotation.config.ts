import { defineConfig } from '@playwright/test';
import { testBrowserLaunchOptions } from '../../../scripts/test-browser.mjs';

export default defineConfig({
  testDir: '../e2e', testMatch: '**/image-preview-annotation.pw.ts', workers: 1, timeout: 45_000,
  outputDir: '../../../.codex-tmp/web-image-annotation-playwright', reporter: [['list']],
  use: { launchOptions: testBrowserLaunchOptions(), baseURL: 'http://127.0.0.1:1489/web/',
    locale: 'zh-CN', headless: true, screenshot: 'only-on-failure' },
  webServer: { cwd: '..',
    command: 'npx vite --config scripts/vite.config.ts --host 127.0.0.1 --port 1489 --strictPort',
    url: 'http://127.0.0.1:1489/web/', reuseExistingServer: false },
});
