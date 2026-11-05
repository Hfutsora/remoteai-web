import { expect, test } from '@playwright/test';

test('production PDF preview fetches its CMap and paints text', async ({ page }) => {
  const failures: string[] = [];
  page.on('pageerror', error => failures.push(error.message));
  page.on('console', message => {
    if (/Missing PDF asset|Unable to load PDF asset|translateFont failed/.test(message.text())) {
      failures.push(message.text());
    }
  });
  const cmapResponse = page.waitForResponse(response => /UniJIS-UCS2-H.*\.bcmap/.test(response.url()));
  await page.goto('e2e/pdf-assets-harness.html');
  const cmap = await cmapResponse;
  expect(cmap.ok()).toBe(true);
  expect(new URL(cmap.url()).pathname).toMatch(/^\/pdf-test\/web\/assets\/UniJIS-UCS2-H-[\w-]+\.bcmap$/);
  expect((await cmap.body()).length).toBeGreaterThan(1000);
  const canvas = page.locator('.file-pdf-page canvas');
  await expect(canvas).toBeVisible();
  expect(await canvas.evaluate((element: HTMLCanvasElement) => {
    const pixels = element.getContext('2d')!.getImageData(0, 0, element.width, element.height).data;
    let ink = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 230) ink++;
    return ink;
  })).toBeGreaterThan(100);
  expect(failures).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('web-production-cmap.png') });
});

test('production standard fonts and WASM retain binary content and the deployment base', async ({ page }) => {
  await page.goto('e2e/pdf-assets-harness.html');
  await expect(page.locator('.file-pdf-page canvas')).toBeVisible();
  for (const [filename, signature] of [
    ['LiberationSans-Regular.ttf', [0, 1, 0, 0]], ['openjpeg.wasm', [0, 97, 115, 109]],
  ] as const) {
    const responsePromise = page.waitForResponse(response => response.url().includes(filename.split('.')[0]));
    const bytes = await page.evaluate(name => window.readPdfAsset(name), filename);
    const response = await responsePromise;
    expect(response.ok()).toBe(true);
    expect(new URL(response.url()).pathname).toMatch(/^\/pdf-test\/web\/assets\//);
    expect(bytes.slice(0, 4)).toEqual(signature);
    expect(bytes.length).toBeGreaterThan(1000);
  }
});
