import { defineConfig } from '@playwright/test';
import base from './playwright.browser-bookmarks.config';

export default defineConfig({ ...base, testMatch: 'mobile-chat-browser.pw.ts',
  outputDir: '../../../.codex-tmp/mobile-chat-browser-web',
  use: { ...base.use, isMobile: true, hasTouch: true },
});
