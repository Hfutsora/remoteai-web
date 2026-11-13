import { expect, test } from '@playwright/test';

for (const enlarged of [false, true]) {
  test(`web browser retains its host inspector: ${enlarged ? 'dark narrow enlarged' : 'light wide'}`,
    async ({ page }, info) => {
      await page.setViewportSize({ width: enlarged ? 900 : 1440, height: 900 });
      await page.route('https://inspector.example.test/**', route => route.fulfill({ contentType: 'text/html',
        body: '<h1>Inspector preview</h1><input aria-label="draft" value="retained">' }));
      await page.goto(`e2e/web-browser-bookmarks-harness.html${enlarged ? '?dark=1&font=20' : ''}`);
      const address = page.locator('.pm-browser-toolbar input');
      await address.fill('https://inspector.example.test/'); await address.press('Enter');
      const frame = page.locator('.pm-browser-surface iframe').contentFrame();
      await expect(frame.getByRole('heading')).toHaveText('Inspector preview');
      await frame.getByRole('heading').click({ button: 'right' });
      await expect(page.locator('.browser-inspector-panel')).toHaveCount(0);
      await expect(frame.getByRole('textbox', { name: 'draft' })).toHaveValue('retained');
      const bounds = await page.locator('.pm-browser-surface iframe').boundingBox();
      expect(bounds!.width).toBeGreaterThan(600);
      expect(bounds!.height).toBeGreaterThan(500);
      const viewport = page.viewportSize()!;
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
      await page.screenshot({ path: info.outputPath(`web-${enlarged ? 'dark-narrow-20px' : 'light-14px'}.png`) });
    });
}
