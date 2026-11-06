import { test } from '@playwright/test';
import { verifyBrowserLoading } from '../../desktop/e2e/browser-loading-checks';

for (const dark of [false, true]) {
  test(`web ${dark ? 'dark narrow' : 'light wide'} browser stop and reload`, async ({ page }, info) => {
    await page.setViewportSize({ width: dark ? 1024 : 1440, height: 900 });
    await page.addInitScript(dark => {
      localStorage.setItem('codex-switch.web.theme.v1', dark ? 'dark' : 'light');
    }, dark);
    await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
    await page.goto('e2e/browser-tabs-harness.html');
    await verifyBrowserLoading(page, info, `web-desktop-${dark ? 'dark-narrow' : 'light-wide'}`);
  });
}
