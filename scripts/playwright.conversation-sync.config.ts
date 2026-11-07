import { testBrowserLaunchOptions } from '../../../scripts/test-browser.mjs';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '../e2e', testMatch: '**/conversation-sync*.pw.ts', workers: 1, timeout: 60_000,
  outputDir: '../../../.codex-tmp/conversation-sync-web', reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:1496/web/', viewport: { width: 1280, height: 900 },
    locale: 'zh-CN', headless: true, launchOptions: testBrowserLaunchOptions(),
    screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { cwd: '..', command: 'npx vite --config scripts/vite.config.ts --host 127.0.0.1 --port 1496 --strictPort',
    url: 'http://127.0.0.1:1496/web/', timeout: 120_000 },
});
