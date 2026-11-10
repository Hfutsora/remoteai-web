import { expect, test } from '@playwright/test';

for (const font of [14, 20]) {
  test(`web managed synchronization pauses and resumes at font ${font}`, async ({ page }) => {
    await page.setViewportSize({ width: font === 20 ? 800 : 1280, height: 1000 });
    await page.goto(`e2e/conversation-sync-harness.html?managed=1&hold=1&path=direct&font=${font}${
      font === 20 ? '&dark=1' : ''}`);
    await page.getByRole('button', { name: '展开项目: F:/projects/remoteai', exact: true }).click();
    await page.getByRole('checkbox').last().check();
    await page.getByRole('button', { name: '对话同步', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('对话总大小');
    await expect(dialog).toContainText('压缩后大小');
    await dialog.getByRole('radio', { name: '覆盖已有对话', exact: true }).check();
    await dialog.getByRole('button', { name: '开始同步', exact: true }).click();
    await expect(dialog.getByText('128.0 KB / 512.0 KB', { exact: true })).toBeVisible();
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await page.screenshot({ path: `../../.codex-tmp/sync-download-web-font${font}-progress.png`, animations: 'disabled' });
    await dialog.getByRole('button', { name: '后台继续' }).click();
    await page.getByRole('button', { name: '下载管理', exact: true }).click();
    await page.getByRole('button', { name: '暂停', exact: true }).click();
    await expect(page.getByText('已暂停', { exact: true })).toBeVisible();
    await page.screenshot({ path: `../../.codex-tmp/sync-download-web-font${font}-paused.png`, animations: 'disabled' });
    await page.evaluate(() => { (Reflect.get(window, 'releaseSyncTransfer') as () => void)(); });
    await page.getByRole('button', { name: '继续下载', exact: true }).click();
    await expect(page.getByText('已导入', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '保存到设备' })).toHaveCount(0);
    await page.screenshot({ path: `../../.codex-tmp/sync-download-web-font${font}-imported.png`, animations: 'disabled' });
    await expect.poll(() => page.evaluate(() => (Reflect.get(window, 'syncCalls') as {
      request: { action: string } }[]).filter(call => call.request.action === 'close').length)).toBe(2);
  });
}
