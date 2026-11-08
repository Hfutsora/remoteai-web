import { test } from '@playwright/test';
import { checkMessageEditing } from '../../desktop/e2e/message-edit-checks';

for (const scenario of ['light', 'dark', 'large-narrow']) {
  test(`web: ${scenario} message editing matches desktop`, async ({ page }) => {
    await page.route('https://fonts.googleapis.com/**', route => route.abort());
    await page.route('https://fonts.gstatic.com/**', route => route.abort());
    await page.setViewportSize({ width: scenario === 'large-narrow' ? 900 : 1100, height: 780 });
    await page.goto(`e2e/message-edit-harness.html?mode=web&${scenario === 'dark' ? 'dark' : ''}`
      + `${scenario === 'large-narrow' ? '&large' : ''}`, { waitUntil: 'domcontentloaded' });
    await checkMessageEditing(page, `../../.codex-tmp/message-edit-web-${scenario}.png`);
  });
}
