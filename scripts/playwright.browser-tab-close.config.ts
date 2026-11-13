import { defineConfig } from '@playwright/test';
import base from './playwright.browser-mobile.config';

export default defineConfig({ ...base, testMatch: 'browser-tab-close.pw.ts',
  outputDir: '../../../.codex-tmp/browser-tab-close-web',
});
