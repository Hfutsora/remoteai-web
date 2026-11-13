import { expect, test } from '@playwright/test';

for (const enlarged of [false, true]) test(`download card stays centered with live progress: ${enlarged}`,
  async ({ page }, info) => {
    await page.setViewportSize({ width: enlarged ? 360 : 390, height: 844 });
    await page.addInitScript(enlarged => {
      localStorage.setItem('codex-switch.web.theme.v1', enlarged ? 'dark' : 'light');
      localStorage.setItem('codex-switch:global-font-size', enlarged ? '20' : '14');
    }, enlarged);
    await page.goto('e2e/mobile-chat-browser-harness.html');
    await page.getByRole('button', { name: '下载文件.zip', exact: true }).click();
    const card = page.locator('.resource-download-card');
    const prefix = `web-mobile-${enlarged ? 'dark-20px' : 'light-14px'}`;
    const capture = async (state: string) => {
      const area = await page.locator('.resource-download-page').boundingBox();
      const bounds = await card.boundingBox();
      expect(Math.abs(bounds!.x + bounds!.width / 2 - area!.x - area!.width / 2)).toBeLessThan(2);
      expect(Math.abs(bounds!.y + bounds!.height / 2 - area!.y - area!.height / 2)).toBeLessThan(2);
      expect(bounds!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
      await page.screenshot({ path: info.outputPath(`${prefix}-${state}.png`) });
    };
    await expect(card).toBeVisible(); await capture('idle');
    await card.getByRole('button', { name: '下载', exact: true }).click();
    const progress = card.getByRole('progressbar');
    await expect.poll(async () => Number(await progress.getAttribute('value'))).toBeGreaterThan(0);
    await expect(card).toContainText(/\d[\d.]* [KM]?B\/s/);
    await capture('downloading');
    await card.getByRole('button', { name: '暂停下载', exact: true }).click();
    await expect(card).toContainText('已暂停');
    const paused = await progress.getAttribute('value');
    await capture('paused');
    await page.waitForTimeout(700);
    await expect(progress).toHaveAttribute('value', paused!);
    await card.getByRole('button', { name: '继续下载', exact: true }).click();
    await expect.poll(async () => Number(await progress.getAttribute('value'))).toBeGreaterThan(Number(paused));
    await capture('resumed');
    await page.evaluate(() => { window.browserDownloads.delay = 0; });
    await expect(progress).toHaveAttribute('value', '100', { timeout: 30_000 });
    await capture('completed');
  });
