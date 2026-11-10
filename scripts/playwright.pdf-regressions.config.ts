import { defineConfig } from '@playwright/test';
import config from './playwright.pdf-continuous.config';

export default defineConfig(config, {
  testMatch: 'pdf-preview-regressions.pw.ts', grep: /web:/,
  outputDir: '../../../.codex-tmp/pdf-preview-regressions-web',
});
