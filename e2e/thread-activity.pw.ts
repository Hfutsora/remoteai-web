import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { activityThreads } from '../../../shared/testing/threadActivityFixture';
import { SIDEBAR_EVENT } from '../../../shared/remote-chat/sidebar';

const output = path.resolve('../../.codex-tmp/thread-activity');
const recent = ['最后活跃 10:30', '较早创建 · 最后活跃 10:25', '最后活跃 10:20',
  '最后活跃 10:15', '最后活跃 10:10', '最后活跃 10:00'];

for (const width of [390, 1280]) {
  test(`web ${width}: activity, live completion and merged custom groups`, async ({ page }) => {
    await mkdir(output, { recursive: true });
    await page.setViewportSize({ width, height: 844 });
    await page.route('**/web/thread-page?*', route => route.fulfill({ json: {
      data: activityThreads, nextCursor: null,
    } }));
    await page.goto('e2e/thread-pagination-harness.html');
    const rows = page.locator('.chat-thread > .chat-grow');
    await expect(rows).toHaveText(['较早的对话 · 正在进行', ...recent.slice(0, 4)]);
    await page.screenshot({ path: path.join(output, `web-${width}-light-running.png`) });
    await page.getByRole('button', { name: /展开显示/ }).click();
    await expect(rows).toHaveText(['较早的对话 · 正在进行', ...recent]);
    await page.screenshot({ path: path.join(output, `web-${width}-light-expanded.png`) });
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('test-chat-event', { detail: {
        method: 'turn/completed', params: { threadId: 'old',
          turn: { id: 'turn', status: 'completed', items: [], completedAt: 800 } },
      } }));
      window.dispatchEvent(new CustomEvent('test-chat-event', { detail: {
        method: 'thread/name/updated', params: { threadId: 'old', threadName: '刚刚完成的对话' },
      } }));
    });
    await expect(page.locator('.chat-thread-status .chat-spinner')).toHaveCount(0);
    await expect(rows).toHaveText(['刚刚完成的对话', ...recent]);
    await page.screenshot({ path: path.join(output, `web-${width}-light-completed.png`) });
    const sidebar = { revision: 2, threads: {}, readState: {}, grouping: {
      groups: [{ id: 'custom', name: '自定义分组', parentId: null }], projects: {},
      threads: Object.fromEntries(activityThreads.map(thread => [thread.id, 'custom'])),
    } };
    await page.evaluate(({ method, params }) => window.dispatchEvent(new CustomEvent('test-chat-event', {
      detail: { method, params },
    })), { method: SIDEBAR_EVENT, params: sidebar });
    await expect(rows).toHaveText(['刚刚完成的对话', ...recent.slice(0, 4)]);
    await page.getByRole('button', { name: /展开显示/ }).click();
    await expect(rows).toHaveText(['刚刚完成的对话', ...recent]);
    await page.screenshot({ path: path.join(output, `web-${width}-light-custom-group.png`) });
  });
}
