import { defineConfig } from '@playwright/test';
import { testBrowserLaunchOptions } from '../../../scripts/test-browser.mjs';

const port = 1438;
export default defineConfig({
  testDir: '../e2e', testMatch: 'mobile-project-picker.pw.ts', workers: 1, timeout: 45_000,
  outputDir: '../../../.codex-tmp/mobile-project-picker-results', reporter: 'list',
  use: { baseURL: `http://127.0.0.1:${port}/web/`, headless: true,
    launchOptions: testBrowserLaunchOptions(), viewport: { width: 390, height: 844 },
    isMobile: true, hasTouch: true, locale: 'zh-CN', screenshot: 'only-on-failure' },
  webServer: { cwd: '..',
      command: `npx vite --config scripts/vite.config.ts --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/web/`, reuseExistingServer: false },
});
