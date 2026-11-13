import { expect, test } from '@playwright/test';

for (const enlarged of [false, true]) test(`chat previews allocate retained browser tabs ${enlarged}`, async ({ page }, info) => {
  await page.setViewportSize({ width: enlarged ? 360 : 390, height: 844 });
  await page.addInitScript(enlarged => {
    localStorage.setItem('codex-switch.web.theme.v1', enlarged ? 'dark' : 'light');
    localStorage.setItem('codex-switch:global-font-size', enlarged ? '20' : '14');
  }, enlarged);
  await page.route('**/preview-site/page', route => route.fulfill({ contentType: 'text/html', body: '<h1>Website preview</h1>' }));
  await page.route('**/preview-site/image.svg', route => route.fulfill({ contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180">'
      + '<rect width="320" height="180" fill="#d5eee5"/><circle cx="160" cy="90" r="50" fill="#138475"/></svg>' }));
  await page.goto('e2e/mobile-chat-browser-harness.html', { waitUntil: 'domcontentloaded' });
  const chat = page.locator('main.chat-page');
  const browser = page.locator('.browser-main-page');
  const back = () => page.locator('nav').getByRole('button', { name: '聊天', exact: true }).click();
  await chat.getByRole('button', { name: '页面预览.html', exact: true }).click();
  await expect(browser).toBeVisible();
  await expect(browser.locator('.pm-browser-page')).toHaveCount(2);
  const first = browser.locator('.pm-browser-page').nth(1).locator('iframe');
  await expect(first.contentFrame().getByRole('heading')).toHaveText('聊天页面预览');
  await first.contentFrame().getByRole('textbox').fill('独立标签保留状态');
  await page.screenshot({ path: info.outputPath(`web-mobile-${enlarged ? 'dark-20px' : 'light-14px'}-html.png`) });
  await back();
  await chat.getByRole('button', { name: '页面预览.html', exact: true }).click();
  await expect(browser.locator('.pm-browser-page')).toHaveCount(3);
  await expect(browser.locator('.pm-browser-page').nth(2).locator('iframe').contentFrame().getByRole('textbox'))
    .toHaveValue('保留页面状态');
  await browser.getByRole('button', { name: /管理标签页/ }).click();
  await page.screenshot({ path: info.outputPath(`web-mobile-${enlarged ? 'dark-20px' : 'light-14px'}-duplicate-tabs.png`) });
  await browser.getByRole('button', { name: '页面预览.html', exact: true }).first().click();
  await expect(first.contentFrame().getByRole('textbox')).toHaveValue('独立标签保留状态');
  await back();
  await chat.getByRole('button', { name: '说明文档.md', exact: true }).click();
  await expect(browser.getByRole('heading', { name: '中文预览标题' })).toBeVisible();
  await page.screenshot({ path: info.outputPath(`web-mobile-${enlarged ? 'dark-20px' : 'light-14px'}-markdown.png`) });
  await browser.getByRole('button', { name: '相关文件', exact: true }).click();
  await expect(browser.locator('.pm-browser-page')).toHaveCount(5);
  await expect(browser.locator('.pm-browser-page').last()).toContainText('const retained');
  await back();
  await chat.getByRole('button', { name: '下载文件.zip', exact: true }).click();
  await expect(browser.locator('.resource-download-card')).toBeVisible();
  await back();
  await chat.getByRole('link', { name: '网页链接' }).click();
  await back();
  await chat.getByRole('link', { name: '网页链接' }).click();
  await expect(browser.locator('.pm-browser-page')).toHaveCount(8);
  await expect(browser.locator('.pm-browser-page').last().locator('iframe').contentFrame().getByRole('heading'))
    .toHaveText('Website preview');
  for (const gesture of ['right-click', 'long-press']) {
    await back();
    const thumbnail = chat.getByRole('button', { name: '放大查看：图片菜单' });
    await thumbnail.scrollIntoViewIfNeeded();
    if (gesture === 'right-click') await thumbnail.click({ button: 'right' });
    else {
      const bounds = (await thumbnail.boundingBox())!;
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart',
        touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }] });
      await page.waitForTimeout(700);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await cdp.detach();
    }
    await page.getByRole('menuitem', { name: '在内置浏览器中打开' }).click();
    const image = browser.locator('.pm-browser-page').last().getByRole('img');
    await expect(image).toBeVisible();
    await image.tap();
    await expect(browser).toBeVisible();
    await expect(image).toBeVisible();
  }
  await expect(browser.locator('.pm-browser-page')).toHaveCount(10);
  await page.screenshot({ path: info.outputPath(`web-mobile-${enlarged ? 'dark-20px' : 'light-14px'}-image.png`) });
});
