import { defineConfig } from '@playwright/test';
import base from './playwright.chat.config';

export default defineConfig({
  ...base,
  testMatch: '**/request-errors.pw.ts',
  outputDir: '../../../.codex-tmp/request-error-scopes-web',
  reporter: 'list',
});
