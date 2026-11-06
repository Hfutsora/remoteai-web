import { defineConfig } from '@playwright/test';
import { testBrowserLaunchOptions } from '../../scripts/test-browser.mjs';

export default defineConfig({
  testDir: './e2e', testMatch: 'chat-surface-theme.pw.ts', workers: 1, timeout: 45_000,
  outputDir: '../../.codex-tmp/chat-surface-theme-web',
  use: { baseURL: 'http://127.0.0.1:1498/web/', launchOptions: testBrowserLaunchOptions(),
    viewport: { width: 1280, height: 1000 }, locale: 'zh-CN', screenshot: 'only-on-failure' },
  webServer: { command: 'npx vite --host 127.0.0.1 --port 1498 --strictPort',
    url: 'http://127.0.0.1:1498/web/', timeout: 120_000 },
});
