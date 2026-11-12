import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react';
import type { BookmarkChannel } from './channel';
import { BookmarkStore } from './store';

function storage() {
  try { return window.localStorage; } catch { return undefined; }
}
const Context = createContext<BookmarkStore | null>(null);
let guest: BookmarkStore | undefined;

export function BookmarkProvider({ scope, channel, children }: {
  scope: string; channel?: BookmarkChannel; children: ReactNode;
}) {
  const store = useMemo(() => new BookmarkStore(scope || 'guest', storage(), channel), [scope, channel]);
  useEffect(() => store.start(), [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}

export function useBookmarks() {
  const context = useContext(Context);
  const store = context ?? (guest ??= new BookmarkStore('guest', storage()));
  const state = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot);
  return { ...state, store };
}
