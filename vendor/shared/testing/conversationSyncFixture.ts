import type { SyncHost, SyncRequest } from '../conversation/sync/types';

export function conversationSyncFixture(parameters: URLSearchParams) {
  const calls: { host: string; request: SyncRequest }[] = [];
  let mode = parameters.get('path') === 'direct' ? 'direct' as const : 'relay' as const;
  let released = false;
  let resume: (() => void) | undefined;
  const release = () => { released = true; resume?.(); };
  const thread = { sessionId: 'thread-sync', sessionKind: 'conversation', title: '排查项目中的登录问题',
    cwd: 'F:/projects/remoteai', updatedAt: 1_799_999_000, sizeBytes: 512 * 1024, matchExcerpt: null };
  const threads = parameters.has('grouped') ? [thread,
    ...Array.from({ length: 64 }, (_, index) => ({ ...thread, sessionId: `thread-${index}`,
      title: `项目对话 ${index + 1}`, updatedAt: thread.updatedAt - index - 1,
      sessionKind: index === 0 ? 'external' : 'conversation' })),
    { ...thread, sessionId: 'other-project', title: '整理第二个项目', cwd: 'D:/clients/remoteai',
      updatedAt: thread.updatedAt - 100 },
    { ...thread, sessionId: 'no-project', title: '临时对话', cwd: '', updatedAt: null },
  ] : [thread];
  const duplicates = parameters.has('duplicates') ? [thread.sessionId] : [];
  const remote = parameters.get('mode') !== 'local';
  const directory = (source: boolean) => ({ name: source ? 'Office PC' : 'My PC', homes: [
    ...(!source && remote ? [] : [{ id: 'default', path: source ? 'D:/work/.codex' : 'C:/Users/demo/.codex',
      enabled: true }]),
    { id: 'codex-gui', path: source ? 'D:/Remote AI/.codex' : 'C:/Remote AI/.codex', enabled: false },
  ] });
  const request = (id: string) => async <T>(request: SyncRequest): Promise<T> => {
    calls.push({ host: id, request });
    let result: unknown = {};
    if (request.action === 'homes') result = directory(id === 'source');
    if (request.action === 'list') result = threads.filter(item => item.title.includes(request.query ?? ''));
    if (['prepare', 'export', 'begin'].includes(request.action)) result = { id: `transfer-${id}`,
      size: 512 * 1024, sha256: 'a'.repeat(64), sessionIds: [thread.sessionId] };
    if (request.action === 'read') {
      if (parameters.has('hold') && request.offset >= 96 * 1024 && !released) {
        await new Promise<void>(resolve => { resume = resolve; });
      }
      if (parameters.has('switchPath') && request.offset > 96 * 1024) mode = 'direct';
      await new Promise(resolve => setTimeout(resolve, mode === 'relay' ? 70 : 15));
      result = { data: 'Y29udmVyc2F0aW9u' };
    }
    if (request.action === 'plan') result = { count: 1, duplicateIds: duplicates };
    if (request.action === 'commit') result = { completedCount: duplicates.length && !request.overwriteIds.length ? 0 : 1,
      skippedCount: duplicates.length && !request.overwriteIds.length ? 1 : 0 };
    return result as T;
  };
  const destination: SyncHost = { id: 'target', name: 'My PC', request: request('target') };
  const source: SyncHost = { id: 'source', name: 'Office PC', request: request('source'), mode: () => mode };
  return { hosts: remote ? [destination, source] : [destination], destination, calls, release };
}
