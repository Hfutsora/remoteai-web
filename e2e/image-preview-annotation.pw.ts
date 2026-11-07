import { expect, test } from '@playwright/test';

for (const narrow of [false, true]) {
  test(`standalone web annotates previews into the current draft (${narrow ? 'narrow dark' : 'wide light'})`,
    async ({ page }, info) => {
      await page.setViewportSize({ width: narrow ? 900 : 1440, height: 960 });
      await page.route('https://fonts.googleapis.com/**', route => route.abort());
      await page.goto(`e2e/image-preview-annotation-harness.html?mode=web${narrow ? '&dark' : ''}`);
      const input = page.getByRole('textbox', { name: '聊天消息', exact: true });
      await input.fill('请查看我圈出的内容');
      await page.getByRole('button', { name: '放大查看：界面截图', exact: true }).click();
      await page.getByRole('button', { name: '标注', exact: true }).click();
      await expect(page.locator('dialog.cs-image-viewer, .cs-image-ai-form')).toHaveCount(0);
      const editor = page.frameLocator('iframe[title="图片标注"]');
      await expect(editor.getByRole('button', { name: '完成', exact: true })).toBeEnabled();
      await editor.getByRole('button', { name: '画笔', exact: true }).click();
      const box = await editor.locator('canvas').boundingBox();
      if (!box) throw new Error('Annotation canvas missing');
      await page.mouse.move(box.x + box.width * .25, box.y + box.height * .3);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width * .65, box.y + box.height * .6, { steps: 12 });
      await page.mouse.up();
      await expect(editor.getByRole('button', { name: '撤销', exact: true })).toBeEnabled();
      const label = `web-${narrow ? 'narrow-dark' : 'wide-light'}`;
      await page.screenshot({ path: info.outputPath(`${label}-annotating.png`) });
      await editor.getByRole('button', { name: '完成', exact: true }).click();
      await expect(page.locator('iframe[title="图片标注"]')).toHaveCount(0);
      const attachments = page.locator('.chat-attachment-preview img');
      await expect(attachments).toHaveCount(1);
      const edited = await attachments.getAttribute('src');
      await expect(input).toHaveValue('请查看我圈出的内容');
      await expect(input).toBeFocused();
      const sent = () => page.evaluate(() =>
        (window as unknown as { imageAnnotationFixture: { sent: unknown[] } }).imageAnnotationFixture.sent);
      expect(await sent()).toHaveLength(0);
      await page.screenshot({ path: info.outputPath(`${label}-in-draft.png`) });
      await page.getByRole('button', { name: '发送消息', exact: true }).click();
      await expect.poll(sent).toHaveLength(1);
      expect((await sent())[0]).toMatchObject({ text: '请查看我圈出的内容', images: [edited] });
    });
}
