import type { SyncThread } from './types';

export interface SyncThreadRow extends SyncThread { key: string; type: 'thread' }
export interface SyncProjectRow {
  key: string; type: 'project'; title: string; cwd: string; updatedAt: number | null;
  children: SyncThreadRow[];
}
export type SyncRow = SyncProjectRow | SyncThreadRow;

export const syncThreadKey = (sessionId: string) => JSON.stringify(['thread', sessionId]);
export const SYNC_RECENT_KEY = JSON.stringify(['project', '']);

const SCRATCH_WORKSPACE = /(?:^|[\\/])codex-gui-workspaces[\\/][\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}[\\/]*$/i;

function projectDirectory(cwd: string) {
  // Older hosts expose the scratch directory instead of an empty project path.
  return !cwd.trim() || SCRATCH_WORKSPACE.test(cwd.trim()) ? '' : cwd;
}

export function groupSyncThreads(threads: SyncThread[]): SyncProjectRow[] {
  const projects = new Map<string, SyncProjectRow>();
  for (const thread of threads) {
    const cwd = projectDirectory(thread.cwd);
    let project = projects.get(cwd);
    if (!project) {
      project = { key: JSON.stringify(['project', cwd]), type: 'project', cwd,
        title: cwd.split(/[\\/]/).filter(Boolean).at(-1) ?? '', updatedAt: null, children: [] };
      projects.set(cwd, project);
    }
    project.children.push({ ...thread, key: syncThreadKey(thread.sessionId), type: 'thread' });
    if ((thread.updatedAt ?? 0) > (project.updatedAt ?? 0)) project.updatedAt = thread.updatedAt;
  }
  return [...projects.values()].map(project => ({ ...project,
    children: project.children.sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0)),
  })).sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0));
}
