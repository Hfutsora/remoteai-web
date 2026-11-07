import { expect, test, type Page } from '@playwright/test';

async function open(page: Page, parameters = '') {
  await page.goto(`e2e/mobile-project-picker-harness.html${parameters}`);
  await page.getByRole('button', { name: '选择项目', exact: true }).click();
  await page.getByRole('button', { name: '新建项目', exact: true }).click();
  await expect(page.getByRole('button', { name: '使用此文件夹', exact: true })).toBeEnabled();
}

async function computer(page: Page) {
  await page.getByRole('button', { name: '文件夹地址', exact: true }).click();
  await page.getByRole('button', { name: '此电脑', exact: true }).click();
}

for (const appearance of [{ name: 'dark', query: '?dark', width: 390, height: 844 },
  { name: 'light', query: '', width: 390, height: 844 },
  { name: 'small-large-font', query: '?dark&font=20', width: 320, height: 740 }]) {
  test(`${appearance.name}: phone folder picker, fixed footer and no-project selection`, async ({ page }) => {
    await page.setViewportSize(appearance);
    await open(page, appearance.query);
    await expect(page.locator('.mobile-project-entry')).toHaveCount(6);
    await expect(page.getByText('选择项目位置', { exact: true })).toBeVisible();
    await expect(page.locator('.mobile-project-current')).toContainText('E:/Workspace');
    await expect(page.getByRole('button', { name: '使用此文件夹', exact: true })).toBeInViewport({ ratio: 1 });
    expect(await page.locator('.mobile-project-sheet').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await expect(page.locator('.mobile-project-address')).toHaveCSS('border-top-style', 'solid');
    await page.screenshot({ path: `../../.codex-tmp/mobile-project-picker-${appearance.name}.png`, animations: 'disabled' });
    await page.getByRole('button', { name: '在当前文件夹中搜索', exact: true }).click();
    await page.getByRole('searchbox').fill('Apps');
    await expect(page.locator('.mobile-project-entry')).toHaveCount(1);
    await page.getByRole('searchbox').fill('no-such-folder');
    await expect(page.getByText('没有匹配的项目', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: '在当前文件夹中搜索', exact: true }).click();
    await page.getByRole('button', { name: '文档', exact: true }).click();
    await expect(page.locator('.mobile-project-current')).toContainText('D:/Cloud/Documents');
    await page.getByRole('button', { name: '最近', exact: true }).click();
    await expect(page.getByRole('button', { name: '使用此文件夹' })).toBeDisabled();
    await page.locator('.mobile-project-entry').getByText('Workspace', { exact: true }).click();
    await computer(page);
    await expect(page.getByRole('button', { name: '使用此文件夹' })).toBeDisabled();
    await expect(page.getByRole('button', { name: '新建文件夹', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'E:', exact: true }).click();
    await page.getByRole('button', { name: 'Workspace', exact: true }).click();
    await page.getByRole('button', { name: 'Apps', exact: true }).click();
    await page.getByRole('button', { name: '使用此文件夹', exact: true }).click();
    await expect(page.getByTestId('chosen-project')).toHaveText('E:/Workspace/Apps');
    await expect(page.getByRole('textbox', { name: '聊天消息' })).toHaveValue('保留这条尚未发送的消息');
    await page.getByRole('button', { name: '选择项目', exact: true }).click();
    const create = await page.getByRole('button', { name: '新建项目', exact: true }).boundingBox();
    const choices = await page.locator('.chat-project-choices').boundingBox();
    expect(create!.width).toBeCloseTo(choices!.width, 0);
    await page.screenshot({ path: `../../.codex-tmp/mobile-project-choices-${appearance.name}.png`, animations: 'disabled' });
    await page.getByRole('button', { name: '未归属项目', exact: true }).click();
    await expect(page.getByTestId('chosen-project')).toBeEmpty();
    await expect(page.getByRole('textbox', { name: '聊天消息' })).toHaveValue('保留这条尚未发送的消息');
  });
}

test('creates folders with validation and retries, recovers from a read error', async ({ page }) => {
  await open(page, '?dark');
  await page.getByRole('button', { name: '新建文件夹', exact: true }).click();
  const name = page.getByRole('textbox', { name: '名称', exact: true });
  await name.fill('../escape');
  await expect(page.getByRole('button', { name: '确定', exact: true })).toBeDisabled();
  await name.fill('新建中文项目');
  await page.evaluate(() => {
    (window as unknown as { projectPickerFixture: { failCreate: boolean } }).projectPickerFixture.failCreate = true;
  });
  await page.getByRole('button', { name: '确定', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: '确定', exact: true }).click();
  await expect(page.locator('.mobile-project-current')).toContainText('E:/Workspace/新建中文项目');
  await page.getByRole('button', { name: '返回上一级', exact: true }).click();
  await page.evaluate(() => {
    (window as unknown as { projectPickerFixture: { failRead: boolean } }).projectPickerFixture.failRead = true;
  });
  await page.getByRole('button', { name: 'Apps', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: '使用此文件夹' })).toBeDisabled();
  await page.getByRole('button', { name: '返回上一级', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Apps', exact: true })).toBeVisible();
});
