import { defineConfig } from '@playwright/test';
import { testBrowserLaunchOptions } from '../../../scripts/test-browser.mjs';

export default defineConfig({
  testDir: '../e2e', testMatch: 'pdf-continuous.pw.ts', grep: /web:|reader labels/, workers: 1, timeout: 90_000,
  outputDir: '../../../.codex-tmp/pdf-continuous-web', reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:1580/web/', launchOptions: testBrowserLaunchOptions(),
    viewport: { width: 1440, height: 1000 }, locale: 'zh-CN', headless: true,
    screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { cwd: '..',
    command: 'npx vite --config scripts/vite.config.ts --host 127.0.0.1 --port 1580 --strictPort',
    url: 'http://127.0.0.1:1580/web/', reuseExistingServer: true },
});
