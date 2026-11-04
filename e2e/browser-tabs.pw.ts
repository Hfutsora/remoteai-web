import { expect, test } from '@playwright/test';
import { longPress } from '../../desktop/e2e/project-browser-touch';

for (const dark of [false, true]) {
  test(`web desktop ${dark ? 'dark narrow' : 'light wide'} browser tab actions`, async ({ page }, info) => {
    if (dark) await page.setViewportSize({ width: 1024, height: 800 });
    await page.addInitScript(dark => {
      localStorage.setItem('codex-switch.web.theme.v1', dark ? 'dark' : 'light');
      localStorage.setItem('codex-switch:global-font-size', dark ? '20' : '14');
    }, dark);
    await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route => route.abort());
    await page.route('**/preview-site/**', route => route.fulfill({ contentType: 'text/html', body: '<h1>Remote AI</h1>' }));
    await page.goto('e2e/browser-tabs-harness.html');
    await page.getByRole('link', { name: '使用指南' }).click();
    const browser = page.locator('.website-preview-browser');
    const tabs = browser.getByRole('tab');
    const add = browser.getByRole('button', { name: '新标签页', exact: true });
    const tab = (await browser.locator('.pm-browser-tab').boundingBox())!;
    const plus = (await add.boundingBox())!;
    expect(plus.x - tab.x - tab.width).toBeCloseTo(6, 0);
    await page.screenshot({ path: info.outputPath('single-tab.png') });
    await add.click(); await add.click();
    await browser.getByRole('button', { name: '全屏展示' }).click();
    await tabs.nth(1).click({ button: 'right' });
    const menu = page.getByRole('menu', { name: '标签页操作', exact: true });
    await expect(menu.getByRole('menuitem')).toHaveCount(5);
    await menu.getByRole('menuitem', { name: '关闭', exact: true }).hover();
    await page.screenshot({ path: info.outputPath('right-click-menu.png'), animations: 'disabled' });
    await menu.getByRole('menuitem', { name: '关闭左侧标签页', exact: true }).click();
    await expect(tabs).toHaveCount(2); await expect(tabs.last()).toHaveAttribute('aria-selected', 'true');
    await expect(menu).toBeHidden();
    await longPress(page, tabs.first(), '标签页操作');
    await expect(menu.getByRole('menuitem')).toHaveCount(5);
    await menu.getByRole('menuitem', { name: '关闭', exact: true }).hover();
    await page.screenshot({ path: info.outputPath('long-press-menu.png'), animations: 'disabled' });
    await menu.getByRole('menuitem', { name: '关闭其他标签页', exact: true }).click();
    await expect(tabs).toHaveCount(1); await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
    await tabs.first().click({ button: 'right' });
    await menu.getByRole('menuitem', { name: '关闭全部标签页', exact: true }).click();
    await expect(browser).toHaveCount(0);
  });
}
