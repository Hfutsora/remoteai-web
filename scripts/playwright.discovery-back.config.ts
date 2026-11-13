import { defineConfig } from '@playwright/test';
import chat from './playwright.chat.config';

export default defineConfig({
  ...chat,
  testMatch: ['**/discovery-back.pw.ts'],
  outputDir: '../../../.codex-tmp/discovery-back-web',
  reporter: [['list']],
  projects: [{ name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }],
});
