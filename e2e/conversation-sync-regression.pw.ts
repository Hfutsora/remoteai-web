import { expect, test } from '@playwright/test';

for (const enlarged of [false, true]) {
  test(`web: unique selection and virtualized 3000-thread project at font ${enlarged ? 20 : 14}`,
    async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      await page.setViewportSize({ width: enlarged ? 860 : 1440, height: enlarged ? 700 : 900 });
      const suffix = enlarged ? '&font=20&dark=1&dialog=1' : '';
      await page.goto(`e2e/conversation-sync-harness.html?regression=1${suffix}`);
      if (enlarged) await page.getByRole('button', { name: '对话同步', exact: true }).click();
      const pane = page.getByRole('region', { name: '对话同步', exact: true });
      const rows = pane.getByRole('row');
      const sameNamed = rows.filter({ has: page.getByText('同名对话', { exact: true }) });
      await expect(sameNamed).toHaveCount(2);
      await sameNamed.nth(0).getByRole('checkbox').check();
      await expect(sameNamed.nth(1).getByRole('checkbox')).not.toBeChecked();
      await expect(pane.getByText('F:/outdated-project', { exact: true })).toHaveCount(0);
      const recent = rows.filter({ has: page.getByText('最近', { exact: true }) });
      await expect(recent.getByRole('cell', { name: '4', exact: true })).toBeVisible();
      await rows.filter({ has: page.getByText('普通目录中的非项目对话', { exact: true }) })
        .getByRole('checkbox').check();
      const project = rows.filter({ has: page.getByText('F:/projects/remoteai', { exact: true }) });
      await expect(project.getByRole('cell', { name: '3000', exact: true })).toBeVisible();
      const startedAt = Date.now();
      await project.getByRole('button').click();
      await expect(pane.getByText('批量项目对话 1', { exact: true })).toBeVisible();
      const expandMs = Date.now() - startedAt;
      const mountedRows = await rows.count();
      expect(expandMs).toBeLessThan(2000);
      expect(mountedRows).toBeLessThan(80);
      console.info(`web, font ${enlarged ? 20 : 14}: 3000 conversations, ${mountedRows} mounted rows, ${expandMs} ms`);
      await project.getByRole('checkbox').check();
      const body = pane.locator('.ant-table-tbody-virtual-holder');
      await body.evaluate(element => { element.scrollTop = element.scrollHeight; });
      const last = rows.filter({ has: page.getByText('批量项目对话 3000', { exact: true }) });
      await expect(last).toBeInViewport();
      await expect(last.getByRole('checkbox')).toBeChecked();
      await last.getByRole('checkbox').uncheck();
      expect(await rows.count()).toBeLessThan(80);
      await body.evaluate(element => { element.scrollTop = 0; });
      await expect(project.getByRole('checkbox')).toBeChecked({ indeterminate: true });
      await expect(sameNamed.nth(0).getByRole('checkbox')).toBeChecked();
      await expect(sameNamed.nth(1).getByRole('checkbox')).not.toBeChecked();
      await page.screenshot({ path: `../../.codex-tmp/sync-regression-web-${enlarged ? 'font20-dark-narrow'
        : 'font14-light-wide'}.png`, animations: 'disabled' });
      await pane.getByRole('button', { name: '对话同步', exact: true }).click();
      await expect(page.getByRole('dialog', { name: '确认同步对话？' })).toBeVisible();
      const ids = await page.evaluate(() => (Reflect.get(window, 'syncCalls') as {
        request: { action: string; sessionIds?: string[] } }[])
        .find(call => call.request.action === 'export')?.request.sessionIds);
      expect(ids).toHaveLength(3001);
      expect(new Set(ids).size).toBe(3001);
      expect(ids).toEqual(expect.arrayContaining(['copy', 'external-projectless', 'large-0', 'large-2998']));
      expect(ids).not.toContain('same-title');
      expect(ids).not.toContain('large-2999');
      expect(errors).toEqual([]);
    });
}
