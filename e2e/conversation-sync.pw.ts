import { expect, test } from '@playwright/test';

for (const path of ['relay', 'direct']) {
  test(`web sync shows ${path}, speed and duplicate confirmation`, async ({ page }) => {
    await page.goto(`e2e/conversation-sync-harness.html?path=${path}&hold=1`);
    await expect(page.getByText('排查项目中的登录问题')).toBeVisible();
    await expect(page.locator('.ant-select-selection-item').first()).toHaveText('Office PC · D:/work/.codex');
    await page.getByRole('checkbox').last().check();
    await page.getByRole('button', { name: '对话同步', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('目标已有 1 条对话。是否覆盖？');
    await dialog.getByRole('radio', { name: '覆盖已有对话', exact: true }).check();
    await expect(dialog).toHaveCSS('transform', 'none');
    await expect(dialog).toHaveCSS('opacity', '1');
    await page.screenshot({ path: `../../.codex-tmp/conversation-sync-web-${path}-overwrite.png`, animations: 'disabled' });
    await dialog.getByRole('button', { name: '开始同步', exact: true }).click();
    await expect(dialog.getByText(path === 'direct' ? 'P2P' : 'Relay', { exact: true })).toBeVisible();
    await expect.poll(async () => dialog.getByText(/KB\/s/).innerText()).not.toBe('0.0 KB/s');
    await expect(dialog.getByRole('button', { name: /开始同步/ })).toBeDisabled();
    await page.screenshot({ path: `../../.codex-tmp/conversation-sync-web-${path}-progress.png`, animations: 'disabled' });
    await page.evaluate(() => { (Reflect.get(window, 'releaseSyncTransfer') as () => void)(); });
    await expect(page.getByRole('alert')).toContainText('已同步 1 条对话');
    const calls = await page.evaluate(() => Reflect.get(window, 'syncCalls') as {
      host: string; request: { action: string; overwriteIds?: string[] } }[]);
    expect(calls.filter(call => call.host === 'source').every(call =>
      ['homes', 'list', 'export', 'read', 'close'].includes(call.request.action))).toBe(true);
  });
}

test('web sync fits an enlarged dark desktop window and can skip duplicates', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 900 });
  await page.goto('e2e/conversation-sync-harness.html?font=20&dark=1');
  await expect(page.getByText('排查项目中的登录问题')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(800);
  await page.getByRole('checkbox').last().check();
  await page.getByRole('button', { name: '对话同步', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('目标已有 1 条对话。是否覆盖？');
  await expect(dialog.getByRole('radio', { name: '跳过已有对话' })).toBeChecked();
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await expect(dialog).toHaveCSS('transform', 'none');
  await expect(dialog).toHaveCSS('opacity', '1');
  await page.screenshot({ path: '../../.codex-tmp/conversation-sync-web-font20-confirm.png', animations: 'disabled' });
  await dialog.getByRole('button', { name: '开始同步', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('跳过 1 条');
});
