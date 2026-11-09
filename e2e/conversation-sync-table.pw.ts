import { expect, test } from '@playwright/test';

const projectPath = 'F:/projects/remoteai';

for (const enlarged of [false, true]) {
  test(`web project sync table at ${enlarged ? '20px narrow dark' : '14px wide light'}`, async ({ page }) => {
    await page.setViewportSize({ width: enlarged ? 860 : 1440, height: enlarged ? 700 : 900 });
    await page.goto(`e2e/conversation-sync-harness.html?grouped=1&dialog=1${enlarged ? '&font=20&dark=1' : ''}`);
    await page.getByRole('button', { name: '对话同步', exact: true }).click();
    const pane = page.getByRole('region', { name: '对话同步', exact: true });
    const project = pane.getByRole('row').filter({ has: page.getByText(projectPath, { exact: true }) });
    await expect(pane.getByRole('button', { name: /^展开项目:/ })).toHaveCount(2);
    await expect(pane.getByRole('button', { name: '收起: 最近', exact: true })).toBeVisible();
    await expect(project.getByRole('cell', { name: '65', exact: true })).toBeVisible();
    await expect(pane.getByText('排查项目中的登录问题')).toBeHidden();
    const prefix = `../../.codex-tmp/sync-table-web-${enlarged ? 'font20-dark-narrow' : 'font14-light-wide'}`;
    await page.screenshot({ path: `${prefix}-collapsed.png`, animations: 'disabled' });
    await project.getByRole('checkbox').check();
    await pane.getByRole('button', { name: `展开项目: ${projectPath}`, exact: true }).click();
    const first = pane.getByRole('row').filter({ has: page.getByText('排查项目中的登录问题', { exact: true }) });
    await expect(first.getByRole('checkbox')).toBeChecked();
    await first.getByRole('checkbox').uncheck();
    await expect(project.getByRole('checkbox')).toBeChecked({ indeterminate: true });
    await pane.getByRole('button', { name: `折叠项目: ${projectPath}`, exact: true }).click();
    await expect(pane.getByText('排查项目中的登录问题')).toBeHidden();
    await expect(pane.getByRole('button', { name: '对话同步', exact: true })).toBeEnabled();
    await pane.getByRole('button', { name: `展开项目: ${projectPath}`, exact: true }).click();
    await expect(first.getByRole('checkbox')).not.toBeChecked();
    const body = pane.locator('.ant-table-tbody-virtual-holder');
    const header = pane.locator('.ant-table-header');
    const top = (await header.boundingBox())!.y;
    const height = await body.evaluate(element => element.clientHeight);
    expect(await body.evaluate(element => element.scrollHeight)).toBeGreaterThan(height);
    await body.evaluate(element => { element.scrollTop = element.scrollHeight; });
    await expect(pane.getByText('项目对话 64', { exact: true })).toBeInViewport();
    expect((await header.boundingBox())!.y).toBe(top);
    expect((await body.boundingBox())!.y + height).toBeLessThanOrEqual(page.viewportSize()!.height);
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(page.viewportSize()!.height);
    expect(await pane.evaluate(element => element.scrollHeight <= element.clientHeight)).toBe(true);
    await page.setViewportSize({ ...page.viewportSize()!, height: page.viewportSize()!.height - 100 });
    await expect.poll(() => body.evaluate(element => element.clientHeight)).toBeLessThan(height);
    await expect(pane.getByRole('button', { name: '对话同步', exact: true })).toBeInViewport();
    await body.evaluate(element => { element.scrollTop = 0; });
    await page.screenshot({ path: `${prefix}-expanded.png`, animations: 'disabled' });
    await pane.locator('.ant-table-thead').getByRole('checkbox').check();
    await pane.getByRole('button', { name: '对话同步', exact: true }).click();
    await expect(page.getByRole('dialog', { name: '确认同步对话？' })).toBeVisible();
    const ids = await page.evaluate(() => (Reflect.get(window, 'syncCalls') as {
      request: { action: string; sessionIds?: string[] } }[])
      .find(call => call.request.action === 'export')?.request.sessionIds);
    expect(ids).toHaveLength(67);
    expect(new Set(ids).size).toBe(67);
    expect(ids).toEqual(expect.arrayContaining(['thread-sync', 'thread-63', 'other-project', 'no-project']));
  });
}

test('web search exposes matching conversations and keeps project folding usable', async ({ page }) => {
  await page.goto('e2e/conversation-sync-harness.html?grouped=1');
  const pane = page.getByRole('region', { name: '对话同步', exact: true });
  await pane.getByPlaceholder('搜索标题和对话内容').fill('项目对话 64');
  await expect(pane.getByText('项目对话 64', { exact: true })).toBeVisible();
  await pane.getByRole('button', { name: `折叠项目: ${projectPath}`, exact: true }).click();
  await expect(pane.getByText('项目对话 64', { exact: true })).toBeHidden();
  await pane.getByPlaceholder('搜索标题和对话内容').fill('不存在的对话');
  await expect(pane.getByText('没有可同步的对话')).toBeVisible();
  await page.screenshot({ path: '../../.codex-tmp/sync-empty-web-light.png', animations: 'disabled' });
});
