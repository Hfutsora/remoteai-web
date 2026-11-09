import { expect, test } from '@playwright/test';
import { connect, fixtureUrl, login, operationCount, screenshot } from './chat-helpers';
import { openChatTool } from './chat-tool-actions';

test('desktop and phone terminal tabs share right-click and long-press close actions', async ({ page, request }, info) => {
  await request.post(`${fixtureUrl}/test/reset`);
  await login(page); await connect(page); await openChatTool(page, '终端');
  const strip = page.getByRole('tablist', { name: '终端标签页' });
  const tabs = strip.getByRole('tab');
  const add = page.getByRole('button', { name: '新建终端', exact: true });
  for (let count = 2; count <= 4; count++) {
    await add.click(); await expect(tabs).toHaveCount(count);
  }
  const ids = await tabs.evaluateAll(elements => elements.map(element => element.id));
  const closed = await operationCount(request, 'guiTerminalClose');
  const target = tabs.nth(1);
  await target.scrollIntoViewIfNeeded();
  await expect(target).toBeInViewport({ ratio: 1 });
  await target.click({ button: 'right' });
  const menu = page.getByRole('menu', { name: '标签页操作' });
  await expect(menu).toBeVisible();
  await expect(tabs.nth(3)).toHaveAttribute('aria-selected', 'true');
  expect((await menu.boundingBox())!.width).toBeLessThanOrEqual(400);
  await screenshot(page, info, `${info.project.name}-terminal-right-click`);
  await menu.getByRole('menuitem', { name: '关闭右侧标签页', exact: true }).click();
  await expect(menu).toBeHidden(); await expect(tabs).toHaveCount(2);
  await expect.poll(() => operationCount(request, 'guiTerminalClose')).toBe(closed + 2);
  expect(await tabs.evaluateAll(elements => elements.map(element => element.id))).toEqual(ids.slice(0, 2));
  await expect(target).toHaveAttribute('aria-selected', 'true');
  await add.click(); await expect(tabs).toHaveCount(3);
  await page.evaluate(() => window.dispatchEvent(new StorageEvent('storage', {
    key: 'codex-switch.web.theme.v1', newValue: 'dark',
  })));
  await target.scrollIntoViewIfNeeded();
  await expect(target).toBeInViewport({ ratio: 1 });
  await page.mouse.move(0, 0);
  const bounds = (await target.boundingBox())!;
  await target.dispatchEvent('pointerdown', { pointerType: 'touch', button: 0, isPrimary: true,
    clientX: bounds.x + bounds.width / 2, clientY: bounds.y + bounds.height / 2 });
  await expect(target).toHaveAttribute('aria-expanded', 'true');
  await target.dispatchEvent('pointerup', { pointerType: 'touch', button: 0, isPrimary: true });
  await target.dispatchEvent('click');
  await expect(menu).toBeVisible();
  await screenshot(page, info, `${info.project.name}-terminal-dark-long-press`);
  await menu.getByRole('menuitem', { name: '关闭其他标签页', exact: true }).click();
  await expect(menu).toBeHidden(); await expect(tabs).toHaveCount(1);
  await expect.poll(() => operationCount(request, 'guiTerminalClose')).toBe(closed + 4);
  await expect(tabs.first()).toHaveAttribute('id', ids[1]);
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  await tabs.first().click({ button: 'right' });
  await expect(menu).toBeVisible();
  for (const action of await menu.getByRole('menuitem').all()) await expect(action).toBeDisabled();
  await page.keyboard.press('Escape'); await expect(menu).toBeHidden();
  await expect(page.getByRole('region', { name: '终端', exact: true })).toBeVisible();
  await expect(tabs.first()).toBeFocused();
  await screenshot(page, info, `${info.project.name}-terminal-surviving-tab`);
});
