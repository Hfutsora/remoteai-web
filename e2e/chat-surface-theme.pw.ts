import { test } from '@playwright/test';
import { checkChatSurfaceTheme } from '../../desktop/e2e/chat-surface-theme-checks';

for (const scenario of ['light', 'dark', 'dark-large']) {
  test(`web: ${scenario} computer, connection and command surfaces stay readable`, async ({ page }, info) => {
    await page.setViewportSize({ width: scenario.endsWith('large') ? 900 : 1280, height: 1000 });
    await page.goto('e2e/chat-surface-theme-harness.html?mode=web'
      + `${scenario.startsWith('dark') ? '&dark' : ''}${scenario.endsWith('large') ? '&large' : ''}`);
    await checkChatSurfaceTheme(page, info, 'web');
  });
}
