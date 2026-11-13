import { defineConfig } from '@playwright/test';
import base from './playwright.browser-mobile.config';

export default defineConfig({ ...base, testMatch: 'browser-numeric-input.pw.ts',
  outputDir: '../../../.codex-tmp/browser-numeric-input-web',
});
