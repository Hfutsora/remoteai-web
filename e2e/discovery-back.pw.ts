import { expect, test } from '@playwright/test';
import { connect, fixtureUrl, login, navigate, screenshot } from './chat-helpers';

for (const mode of ['light', 'dark'] as const) {
  test(`mobile Discover entries return and reopen in ${mode} mode`, async ({ page, request }, info) => {
    await request.post(`${fixtureUrl}/test/reset`);
    await page.route('**/sync/ssh-profiles**', route => route.fulfill({ json: [] }));
    await login(page);
    await connect(page);
    await page.evaluate(theme => window.dispatchEvent(new StorageEvent('storage', {
      key: 'codex-switch.web.theme.v1', newValue: theme,
    })), mode);
    await navigate(page, '发现');
    const list = page.locator('.discovery-list');
    const entries = await list.locator('button').allTextContents();
    expect(entries).toHaveLength(6);
    for (const [index, label] of entries.entries()) {
      for (let repeat = 0; repeat < 2; repeat++) {
        await list.getByRole('button', { name: label.trim(), exact: true }).click();
        const back = page.getByRole('button', {
          name: label.trim() === 'Token 汇总' ? '返回上一层' : '返回发现', exact: true,
        });
        await expect(back).toBeVisible();
        if (!repeat) await screenshot(page, info, `web-mobile-${mode}-${index}-open`);
        await back.click();
        await expect(back).toBeHidden();
        await expect(list).toBeVisible();
        await expect(list.locator('button')).toHaveCount(6);
      }
    }
    await screenshot(page, info, `web-mobile-${mode}-returned-discover`);
  });
}
