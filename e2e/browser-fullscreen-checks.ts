import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';

export async function verifyFullscreenControl(options: {
  page: Page; browser: Locator; info: TestInfo; label: string;
}) {
  const { page, browser, info, label } = options;
  const control = browser.getByRole('button', { name: '更多操作', exact: true });
  const exit = browser.getByRole('menuitem', { name: '退出全屏', exact: true });
  const capture = async (state: string) => {
    const popup = browser.locator('.browser-fullscreen-popover');
    await expect(popup).toHaveCSS('opacity', '1');
    await expect(popup).not.toHaveClass(/zoom-big-(enter|appear|leave)/);
    await page.screenshot({ path: info.outputPath(`${label}-fullscreen-${state}.png`), animations: 'disabled' });
  };
  await expect(control).toBeVisible();
  await expect(control).toHaveText('');
  await expect(exit).toBeHidden();
  const before = (await control.boundingBox())!;
  await control.tap(); await expect(exit).toBeVisible();
  await page.keyboard.press('Escape'); await expect(exit).toBeHidden();
  const cdp = await page.context().newCDPSession(page);
  const drag = async (x: number, y: number, cancelled = false) => {
    const bounds = (await control.boundingBox())!;
    const start = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    for (let step = 1; step <= 5; step++) await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove', touchPoints: [{ x: start.x + (x - start.x) * step / 5,
        y: start.y + (y - start.y) * step / 5 }],
    });
    await cdp.send('Input.dispatchTouchEvent', { type: cancelled ? 'touchCancel' : 'touchEnd', touchPoints: [] });
    await expect(exit).toBeHidden();
  };
  await drag(80, 400);
  expect((await control.boundingBox())!.y).toBeGreaterThan(before.y + 200);
  await control.tap(); await expect(exit).toBeVisible();
  await capture('dragged-menu');
  await page.keyboard.press('Escape'); await expect(exit).toBeHidden(); await expect(control).toBeVisible();
  await control.tap(); await expect(exit).toBeVisible();
  await page.touchscreen.tap(250, 600); await expect(exit).toBeHidden();
  await drag(389, 843);
  const edge = (await control.boundingBox())!;
  expect(edge.x + edge.width).toBeLessThanOrEqual(378);
  expect(edge.y + edge.height).toBeLessThanOrEqual(832);
  await control.tap(); await expect(exit).toBeVisible();
  const menu = (await exit.boundingBox())!;
  expect(menu.x).toBeGreaterThanOrEqual(0); expect(menu.y + menu.height).toBeLessThan(844);
  await capture('edge-menu');
  await page.keyboard.press('Escape');
  await drag(80, 400, true);
  await page.setViewportSize({ width: 320, height: 568 });
  await expect(control).toBeVisible();
  const resized = (await control.boundingBox())!;
  expect(resized.x + resized.width).toBeLessThanOrEqual(308);
  expect(resized.y + resized.height).toBeLessThanOrEqual(556);
  await control.tap(); await expect(exit).toBeVisible();
  await capture('narrow-menu');
  await exit.click(); await cdp.detach();
  await page.setViewportSize({ width: 390, height: 844 });
}
