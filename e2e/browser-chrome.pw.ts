import { test } from '@playwright/test';
import { prepareBrowserChrome, verifyBrowserChrome } from '../../desktop/e2e/browser-chrome-checks';

for (const dark of [false, true]) {
  test(`web ${dark ? 'dark narrow' : 'light wide'} website icons, addresses and hover`, async ({ page }, info) => {
    await page.setViewportSize({ width: dark ? 1024 : 1440, height: 900 });
    await page.addInitScript(dark => localStorage.setItem('codex-switch.web.theme.v1', dark ? 'dark' : 'light'), dark);
    await prepareBrowserChrome(page);
    await page.goto('e2e/browser-tabs-harness.html');
    await verifyBrowserChrome({ page, info, label: `web-desktop-${dark ? 'dark-narrow' : 'light-wide'}` });
  });
}
