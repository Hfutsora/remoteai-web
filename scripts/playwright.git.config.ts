import { defineConfig } from '@playwright/test';
import { testBrowserLaunchOptions } from '../../../scripts/test-browser.mjs';

export default defineConfig({
  testDir: '../e2e', testMatch: 'git-virtualization.pw.ts', workers: 1, timeout: 90_000,
  outputDir: '../../../.codex-tmp/git-virtualization-web', reporter: 'list',
  use: { launchOptions: testBrowserLaunchOptions(), locale: 'zh-CN', headless: true,
    baseURL: 'http://127.0.0.1:1489/web/', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: { cwd: '..',
    command: 'npx vite --config scripts/vite.config.ts --host 127.0.0.1 --port 1489 --strictPort',
    url: 'http://127.0.0.1:1489/web/', timeout: 120_000 },
});
