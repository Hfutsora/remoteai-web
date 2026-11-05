import { defineConfig } from '@playwright/test';
import { testBrowserLaunchOptions } from '../../scripts/test-browser.mjs';

export default defineConfig({
  testDir: './e2e', testMatch: 'pdf-assets.pw.ts', workers: 1, timeout: 60_000,
  outputDir: '../../.codex-tmp/pdf-preview-web', reporter: 'list',
  use: { launchOptions: testBrowserLaunchOptions(), baseURL: 'http://127.0.0.1:1518/pdf-test/web/',
    headless: true, screenshot: 'only-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  ],
  webServer: { command: 'node e2e/pdf-preview-server.mjs',
    url: 'http://127.0.0.1:1518/pdf-test/web/e2e/pdf-assets-harness.html', timeout: 120_000 },
});
