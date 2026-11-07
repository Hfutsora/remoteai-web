import { expect, test } from '@playwright/test';
import { connect, fixtureUrl, login, openChatList, screenshot } from './chat-helpers';

const error = { message: 'unexpected status 502 Bad Gateway, url: http://127.0.0.1:51524/responses' };
const threadId = 'demo-chat';
const turnId = 'scoped-error';

test('keeps reply errors inside the conversation and out of a new chat', async ({ page, request }, info) => {
  await request.post(`${fixtureUrl}/test/reset`);
  await login(page);
  await connect(page);
  await openChatList(page);
  await page.getByText('移动端聊天体验', { exact: true }).click();
  await expect(page.getByRole('heading', { name: '移动端聊天体验', exact: true })).toBeVisible();
  await request.post(`${fixtureUrl}/test/chat-event`, { data: { method: 'turn/started', params: {
    threadId, turn: { id: turnId, status: 'inProgress', items: [
      { id: 'scoped-question', type: 'userMessage', text: '检查连接。' },
    ] },
  } } });
  const failure = { method: 'error', params: { threadId, turnId, error, willRetry: false } };
  await request.post(`${fixtureUrl}/test/chat-event`, { data: failure });
  await expect(page.locator('.chat-turn-error')).toContainText('本次回复遇到问题，已中断。');
  await expect(page.locator('.chat-error')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(error.message);
  await screenshot(page, info, `${info.project.name}-error-inside-conversation`);
  await openChatList(page);
  await page.getByRole('button', { name: '新聊天', exact: true }).click();
  await expect(page.getByRole('heading', { name: '新聊天', exact: true })).toBeVisible();
  await request.post(`${fixtureUrl}/test/chat-event`, { data: failure });
  await expect(page.getByRole('heading', { name: '想一起完成什么？', exact: true })).toBeVisible();
  await expect(page.locator('.chat-error, .chat-turn-error')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText(error.message);
  await screenshot(page, info, `${info.project.name}-new-chat-clean`);
});
