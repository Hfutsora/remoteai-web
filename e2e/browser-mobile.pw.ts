import { expect, test } from '@playwright/test';

for (const dark of [false, true]) test(`mobile browser retains pages and opens bookmark drawer ${dark}`, async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(dark => {
    localStorage.setItem('codex-switch.web.theme.v1', dark ? 'dark' : 'light');
    localStorage.setItem('codex-switch:global-font-size', dark ? '20' : '14');
    localStorage.setItem('codex-switch.web.session.v1', JSON.stringify({ baseUrl: `${location.origin}/bookmark-fixture`,
      email: 'bookmarks@example.test', accessToken: 'fixture', refreshToken: 'fixture' }));
  }, dark);
  await page.route('**/bookmark-fixture/**', route => route.fulfill({ json: {
    accounts: [], providers: [], devices: [], email: 'bookmarks@example.test', id: 'bookmarks', ticket: 'fixture',
  } }));
  await page.routeWebSocket('**/bookmark-fixture/lounge/socket*', socket => {
    socket.onMessage(raw => {
      const frame = JSON.parse(String(raw));
      if (frame.type === 'authenticate') socket.send(JSON.stringify({ type: 'ready', bookmarks: true,
        user: { id: 'bookmarks', account: 'bookmarks@example.test' } }));
      if (frame.type === 'bookmarks-read') socket.send(JSON.stringify({ type: 'bookmarks', id: frame.id,
        document: { revision: 1, entries: [{ id: 'pc-link', kind: 'link', title: 'PC bookmark',
          url: `${new URL(info.project.use.baseURL!).origin}/session-fixture`, parentId: '', position: 0 }] } }));
    });
  });
  await page.route('**/session-fixture', route => route.fulfill({ contentType: 'text/html',
    body: '<h1>Retained browser page</h1><input value="draft-kept"><script>sessionStorage.saved="retained"</script>' }));
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  await page.locator('.mobile-tabbar').getByText('发现', { exact: true }).click();
  await expect(page.locator('.discovery-page')).toBeVisible();
  await expect(page.locator('.adm-toast-mask')).toHaveCount(0);
  await page.screenshot({ path: info.outputPath(`web-mobile-${dark ? 'dark-20px' : 'light-14px'}-discovery.png`),
    animations: 'disabled' });
  await page.locator('.discovery-page').getByRole('button', { name: '浏览器', exact: true }).click();
  const browser = page.locator('.browser-main-page');
  await expect(browser).toBeVisible();
  await browser.getByRole('button', { name: '浏览器设置', exact: true }).click();
  await page.getByRole('button', { name: '所有书签', exact: true }).last().click();
  const drawer = page.locator('.browser-bookmark-drawer');
  await expect(drawer.getByRole('button', { name: /PC bookmark/ })).toBeVisible();
  await expect(drawer).not.toHaveClass(/-enter/);
  await expect.poll(async () => (await drawer.locator('.ant-drawer-content-wrapper').boundingBox())?.y ?? 844)
    .toBeLessThan(220);
  await page.screenshot({ path: info.outputPath(`web-mobile-${dark ? 'dark-20px' : 'light-14px'}-bookmarks.png`),
    animations: 'disabled' });
  await drawer.getByRole('button', { name: /PC bookmark/ }).click();
  const frame = browser.locator('iframe');
  await expect(frame.contentFrame().getByRole('heading', { name: 'Retained browser page' })).toBeVisible();
  await frame.contentFrame().locator('input').fill('unsaved-draft');
  const retained = await frame.elementHandle();
  await browser.getByRole('button', { name: '浏览器设置', exact: true }).click();
  await page.getByRole('button', { name: /^关\s*闭$/ }).last().click();
  await page.locator('.discovery-page').getByRole('button', { name: '浏览器', exact: true }).click();
  expect(await frame.evaluate((node, previous) => node === previous, retained)).toBe(true);
  await expect(frame.contentFrame().locator('input')).toHaveValue('unsaved-draft');
  expect(await frame.evaluate(node => node.contentWindow?.sessionStorage.saved)).toBe('retained');
});
