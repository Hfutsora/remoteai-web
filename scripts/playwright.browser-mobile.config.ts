import { defineConfig } from '@playwright/test';
import base from './playwright.browser-bookmarks.config';

export default defineConfig({ ...base, testMatch: 'browser-mobile.pw.ts',
  outputDir: '../../../.codex-tmp/browser-mobile-web',
  use: { ...base.use, isMobile: true, hasTouch: true },
});
