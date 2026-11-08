import { expect, it } from 'vitest';
import { emptySidebar, projectThreadGroups } from '../../../../shared/remote-chat/sidebar';
import { ThreadListCache } from '../../../../shared/remote-chat/client/threadListCache';
import type { Thread } from '../../../../shared/conversation/types';

it('orders desktop and mobile web projects by activity, including loaded pages and live replies', async () => {
  const thread = (id: string, updatedAt: number): Thread => ({ id, updatedAt, cwd: '/project', preview: id });
  const threads = [thread('old', 1), thread('recent', 30), thread('middle', 20), thread('tie', 20)];
  const sidebar = emptySidebar();
  const query = { archived: false };
  const cache = new ThreadListCache(async input => input.cursor
    ? { data: threads.slice(2), nextCursor: null } : { data: threads.slice(0, 2), nextCursor: 'next' });
  await cache.read(query);
  await cache.read({ ...query, cursor: 'next' });
  const ids = () => projectThreadGroups(cache.peek(query)!.data, sidebar)[0].data.map(entry => entry.id);
  expect(ids()).toEqual(['recent', 'middle', 'tie', 'old']);
  sidebar.threads.old = { cwd: '/project', title: 'Old', projectName: '', running: true };
  expect(ids()).toEqual(['old', 'recent', 'middle', 'tie']);
  sidebar.threads.old.running = false;
  cache.receive({ method: 'turn/completed', params: { threadId: 'old',
    turn: { id: 'turn', status: 'completed', items: [], completedAt: 40 } } });
  expect(ids()).toEqual(['old', 'recent', 'middle', 'tie']);
  expect(threads.map(entry => entry.updatedAt)).toEqual([1, 30, 20, 20]);
});
