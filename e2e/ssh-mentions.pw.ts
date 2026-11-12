import { expect, test } from '@playwright/test';

for (const appearance of [{ width: 1280, large: false, dark: false },
  { width: 900, large: true, dark: true },
  { width: 680, large: true, dark: true }, { width: 390, large: false, dark: false },
  { width: 390, large: true, dark: true }]) {
  const label = `web-${appearance.dark ? 'dark' : 'light'}-${appearance.width}`;
  test(`${label} SSH candidates filter, select and send`, async ({ page }) => {
    await page.setViewportSize({ width: appearance.width, height: 900 });
    await page.goto(`e2e/ssh-mentions-harness.html?${appearance.large ? 'large&' : ''}${appearance.dark ? 'dark' : ''}`);
    const editor = page.getByRole('textbox', { name: '聊天消息', exact: true });
    if (appearance.width >= 861) {
      await expect(editor).toHaveAttribute('placeholder', /# 引用 SSH/);
      await expect(editor).not.toHaveAttribute('placeholder', /描述任务/);
    }
    await page.screenshot({ path: `../../.codex-tmp/ssh-mentions/${label}-placeholder.png` });
    await editor.fill('#');
    const popup = page.getByRole('menu', { name: '已保存的连接', exact: true });
    await expect(popup.getByRole('menuitem')).toHaveCount(2);
    expect((await popup.locator('..').boundingBox())!.width).toBeLessThanOrEqual(400);
    await page.screenshot({ path: `../../.codex-tmp/ssh-mentions/${label}-candidates.png` });
    await editor.fill('#开发'); await expect(popup.getByRole('menuitem')).toHaveCount(1);
    if (appearance.large) await popup.getByRole('menuitem').first().click();
    else await editor.press('Enter');
    await expect(page.getByText('#开发服务器', { exact: true })).toBeVisible();
    await expect(page.locator('body')).not.toHaveAttribute('data-sent');
    await page.screenshot({ path: `../../.codex-tmp/ssh-mentions/${label}-selected.png` });
    await editor.fill('检查磁盘空间');
    await page.getByRole('button', { name: '发送消息', exact: true }).click();
    const input = JSON.parse((await page.locator('body').getAttribute('data-sent'))!);
    expect(input.attachments).toEqual([{ kind: 'ssh', name: '开发服务器', path: 'ssh-profile://development' }]);
  });
}

test('desktop reference hints are translated in every released language', async ({ page }) => {
  for (const lang of ['en', 'ru', 'ja']) {
    await page.goto(`e2e/ssh-mentions-harness.html?lang=${lang}`);
    await expect(page.getByRole('textbox')).toHaveAttribute('placeholder', /^%.*#.*SSH/);
  }
});
