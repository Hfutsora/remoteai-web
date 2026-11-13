import type { GuiState, Thread } from './types';
import type { ChatState } from '../remote-chat/client/types';
import type { SidebarSnapshot } from '../remote-chat/sidebar';
import { threadPresentation } from '../remote-chat/sidebar';

export interface RunningConversation {
  id: string;
  title: string;
  cwd: string;
  projectName?: string;
  needsInput: boolean;
}

function sidebarEntries(sidebar: SidebarSnapshot) {
  return new Map(Object.entries(sidebar.threads).filter(([, thread]) => thread.running)
    .map(([id, thread]) => [id, { id, title: thread.title, cwd: thread.cwd,
      projectName: thread.projectName, needsInput: false } as RunningConversation]));
}

/** Include cached live conversations even when the sidebar is filtered or paginated. */
export function localRunningConversations(state: GuiState, sidebar: SidebarSnapshot): RunningConversation[] {
  const entries = sidebarEntries(sidebar);
  const threads = new Map(state.threads.map(thread => [thread.id, thread]));
  Object.values(state.conversations).forEach(value => threads.set(value.thread.id, value.thread));
  for (const [id, thread] of threads) {
    const active = Boolean(state.conversations[id]?.activeTurn) || state.pendingRequest?.threadId === id;
    if (!active && !(sidebar.threads[id]?.running ?? thread.status?.type === 'active')) {
      entries.delete(id);
      continue;
    }
    entries.set(id, { id, title: thread.name || thread.preview || sidebar.threads[id]?.title || '',
      cwd: state.projectOverrides[id] ?? thread.cwd, projectName: sidebar.threads[id]?.projectName,
      needsInput: false });
  }
  return [...entries.values()].map(entry => ({ ...entry,
    needsInput: state.approvals.some(event => event.params.threadId === entry.id) }));
}

export function remoteRunningConversations(state: ChatState): RunningConversation[] {
  const entries = sidebarEntries(state.sidebar);
  const threads = new Map<string, Thread>(state.threads.map(thread => [thread.id, thread]));
  if (state.selected) threads.set(state.selected.id, state.selected);
  for (const [id, thread] of threads) {
    const presentation = threadPresentation(thread, state.sidebar);
    if (!presentation.running) {
      entries.delete(id);
      continue;
    }
    entries.set(id, { id, title: presentation.title, cwd: presentation.cwd,
      projectName: presentation.projectName, needsInput: false });
  }
  return [...entries.values()].map(entry => ({ ...entry,
    needsInput: state.approvals.some(event => event.params.threadId === entry.id) }));
}
