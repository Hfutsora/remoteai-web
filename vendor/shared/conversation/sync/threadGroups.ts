import type { SyncThread } from './types';

export interface SyncThreadRow extends SyncThread { key: string; type: 'thread' }
export interface SyncProjectRow {
  key: string; type: 'project'; title: string; cwd: string; updatedAt: number | null;
  children: SyncThreadRow[];
}
export type SyncRow = SyncProjectRow | SyncThreadRow;

export const syncThreadKey = (sessionId: string) => JSON.stringify(['thread', sessionId]);

export function groupSyncThreads(threads: SyncThread[]): SyncProjectRow[] {
  const projects = new Map<string, SyncProjectRow>();
  for (const thread of threads) {
    let project = projects.get(thread.cwd);
    if (!project) {
      project = { key: JSON.stringify(['project', thread.cwd]), type: 'project', cwd: thread.cwd,
        title: thread.cwd.split(/[\\/]/).filter(Boolean).at(-1) ?? '', updatedAt: null, children: [] };
      projects.set(thread.cwd, project);
    }
    project.children.push({ ...thread, key: syncThreadKey(thread.sessionId), type: 'thread' });
    if ((thread.updatedAt ?? 0) > (project.updatedAt ?? 0)) project.updatedAt = thread.updatedAt;
  }
  return [...projects.values()].map(project => ({ ...project,
    children: project.children.sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0)),
  })).sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0));
}
