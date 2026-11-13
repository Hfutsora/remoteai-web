import { defineConfig } from '@playwright/test';
import { testBrowserLaunchOptions } from '../../../scripts/test-browser.mjs';

export default defineConfig({
  testDir: '../e2e', testMatch: ['bottom-navigation.pw.ts', 'browser-mobile.pw.ts'],
  workers: 1, timeout: 90_000, outputDir: '../../../.codex-tmp/bottom-navigation-web',
  use: { baseURL: 'http://127.0.0.1:1589/web/', launchOptions: testBrowserLaunchOptions(),
    locale: 'zh-CN', isMobile: true, hasTouch: true, screenshot: 'only-on-failure' },
  webServer: { cwd: '..',
    command: 'npx vite --config scripts/vite.config.ts --host 127.0.0.1 --port 1589 --strictPort',
    url: 'http://127.0.0.1:1589/web/', timeout: 120_000 },
});
