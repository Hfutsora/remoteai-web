import { expect, test } from '@playwright/test';
import type { TokenSummary } from '../../../shared/remote-chat/tokenSummary';
import { officialUsageFixture } from '../../desktop/e2e/official-usage-fixture';

const summary = (weeks: number, endTs: number): TokenSummary => ({ weeks, endTs, startTs: 0,
  refreshSeconds: 3600, thresholdTokens: 128000, dateKeys: ['2026-10-24'],
  dailyUsage: [{ date: '2026-10-24', totalTokens: 1234567, inputTokens: 1200000,
    outputTokens: 34567, reasoningTokens: 2000, cachedTokens: 1000000 }],
  breakdown: [], quotaHistory: [], rankings: { providers: [], models: [], accounts: [] }, entryCount: 1,
  errors: { usage: false, analytics: false, quota: false } });

test('retains the latest token summary while refreshing and after an offline reload', async ({ page }, info) => {
  let release: (() => void) | undefined;
  let delay = false;
  let timestamp = 1800000000;
  await page.route('**/token-summary-fixture.json?*', async route => {
    if (delay) await new Promise<void>(resolve => { release = resolve; });
    const weeks = Number(new URL(route.request().url()).searchParams.get('weeks'));
    await route.fulfill({ json: summary(weeks, timestamp) });
  });
  await page.goto('e2e/token-summary-harness.html');
  await page.getByRole('button', { name: 'Open summary' }).click();
  const weeks = page.getByRole('spinbutton');
  const refresh = page.getByRole('button', { name: '刷新 Token 汇总' });
  const total = page.locator('.chat-token-card').filter({
    has: page.getByRole('heading', { name: /周.*Token.*总消耗|weeks.*Total tokens/ }),
  });
  await expect(total).toContainText('1.23M');
  await weeks.fill('3');
  await page.getByRole('button', { name: '应用', exact: true }).click();
  await expect(total.locator('h3')).toContainText('3');
  await expect(refresh).toBeEnabled();
  const updated = page.locator('.chat-token-summary > .chat-muted').last();
  const savedTime = await updated.innerText();
  const savedTotal = (await total.textContent())!;
  await page.getByRole('button', { name: /^(关闭|关闭详情抽屉)$/ }).last().click();
  delay = true;
  timestamp += 10;
  await page.getByRole('button', { name: 'Open summary' }).click();
  await expect(refresh).toBeDisabled();
  await expect(total).toHaveText(savedTotal);
  await expect(updated).toHaveText(savedTime);
  await expect(weeks).toHaveValue('3');
  await page.screenshot({ path: info.outputPath('cached-refresh.png'), animations: 'disabled' });
  await expect.poll(() => !!release).toBe(true);
  release!();
  await expect(refresh).toBeEnabled();
  await expect(updated).not.toHaveText(savedTime);
  const latestTime = await updated.innerText();
  await page.reload();
  await page.getByRole('button', { name: 'Offline', exact: true }).click();
  await page.getByRole('button', { name: 'Open summary' }).click();
  await expect(total).toHaveText(savedTotal);
  await expect(weeks).toHaveValue('3');
  await expect(updated).toHaveText(latestTime);
  expect(await page.locator('.chat-token-summary').evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('cached-offline-reload.png'), animations: 'disabled' });
});

test('official usage charts compare accounts and expose device details', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('codex-switch:language', 'zh'));
  await page.route('**/token-summary-fixture.json?*', route => route.fulfill({ json: {
    ...summary(Number(new URL(route.request().url()).searchParams.get('weeks')), 1800000000),
    officialUsage: officialUsageFixture(),
  } }));
  await page.goto('e2e/token-summary-harness.html');
  await page.getByRole('button', { name: 'Open summary' }).click();
  const panel = page.locator('.chat-token-card').filter({ has: page.getByRole('heading', { name: '官方账户跨设备用量' }) });
  await expect(panel.getByText('18 / 30USD', { exact: true })).toBeVisible();
  await expect(panel.getByRole('meter').first()).toHaveAttribute('aria-valuenow', '60');
  await expect(panel.locator('.official-usage-account').nth(2).getByRole('meter')).toHaveCount(0);
  await panel.getByRole('heading').evaluate(node => node.scrollIntoView({ block: 'start' }));
  await page.screenshot({ animations: 'disabled', path: info.outputPath('web-light-tokens.png') });
  await panel.getByText('消耗金额（USD）', { exact: true }).first().click();
  await expect(panel.locator('.official-usage-account').first()).toHaveAttribute('aria-label', 'studio@example.com');
  await panel.getByRole('button', { name: '设备 · alex.chen@example.com' }).click();
  await expect(panel.getByRole('cell', { name: 'Office PC', exact: true })).toBeVisible();
  expect(await panel.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  await panel.getByRole('cell', { name: 'Laptop', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ animations: 'disabled', path: info.outputPath('web-light-cost-details.png') });
  await page.evaluate(() => {
    localStorage.setItem('codex-switch:global-font-size', '20');
    localStorage.setItem('codex-switch.web.theme.v1', 'dark');
  });
  await page.reload();
  await page.getByRole('button', { name: 'Open summary' }).click();
  await expect(panel.getByText('18 / 30USD', { exact: true })).toBeVisible();
  await expect(panel.locator('.official-usage-chart')).toHaveCSS('font-size', '20px');
  await panel.getByRole('button', { name: '设备 · alex.chen@example.com' }).click();
  expect(await panel.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
  await panel.getByRole('heading').evaluate(node => node.scrollIntoView({ block: 'start' }));
  await page.screenshot({ animations: 'disabled', path: info.outputPath('web-dark-enlarged-chart.png') });
  await panel.getByRole('cell', { name: 'Laptop', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ animations: 'disabled', path: info.outputPath('web-dark-enlarged-details.png') });
  await panel.getByText('unused@example.com', { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ animations: 'disabled', path: info.outputPath('web-dark-enlarged-last-accounts.png') });
  expect(errors).toEqual([]);
});
