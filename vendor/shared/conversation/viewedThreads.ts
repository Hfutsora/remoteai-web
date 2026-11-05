import { invoke, isDesktopApp } from '../platform/localBackend';

const viewers = new Map<object, string>();
let revision = 0;
let applied = -1;
let pending: Promise<void> | undefined;

export const viewedThreadIds = () => [...new Set(viewers.values())];

/** One serialized union per renderer; remote viewers must not replace the local selection. */
export function watchConversation(owner: object, threadId: string | null): Promise<void> {
  if (viewers.get(owner) !== (threadId ?? undefined)) {
    if (threadId) viewers.set(owner, threadId);
    else viewers.delete(owner);
    revision++;
  }
  if (!isDesktopApp) return Promise.resolve();
  return synchronize();
}

function synchronize(): Promise<void> {
  if (!pending && applied !== revision) {
    pending = (async () => {
      while (applied !== revision) {
        const current = revision;
        await invoke<void>('codex_gui_watch', { threadIds: viewedThreadIds() });
        applied = current;
      }
    })().finally(() => { pending = undefined; });
  }
  // A selection can change after the loop returns but before its finally callback runs.
  // Every waiter must include that last change, including one arriving in that microtask gap.
  return (pending ?? Promise.resolve()).then(() => applied === revision ? undefined : synchronize());
}
