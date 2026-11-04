import type { BrowserTab } from './browserState';

export type BrowserTabCloseAction = 'close' | 'closeLeft' | 'closeRight' | 'closeAll' | 'closeOthers';

export function browserTabsToClose(tabs: BrowserTab[], id: string, action: BrowserTabCloseAction): string[] {
  const index = tabs.findIndex(tab => tab.id === id);
  if (index < 0) return [];
  return tabs.filter((tab, position) => {
    switch (action) {
      case 'close': return tab.id === id;
      case 'closeLeft': return position < index;
      case 'closeRight': return position > index;
      case 'closeAll': return true;
      case 'closeOthers': return tab.id !== id;
    }
  }).map(tab => tab.id);
}

/** Keep the selection when possible; otherwise prefer the nearest surviving tab to its left. */
export function remainingBrowserTabs(tabs: BrowserTab[], activeId: string, ids: string[]) {
  const closed = new Set(ids);
  const remaining = tabs.filter(tab => !closed.has(tab.id));
  if (!closed.has(activeId)) return { tabs: remaining, activeId };
  const index = tabs.findIndex(tab => tab.id === activeId);
  const previous = tabs.slice(0, index).filter(tab => !closed.has(tab.id)).at(-1);
  return { tabs: remaining, activeId: previous?.id ?? remaining[0]?.id ?? '' };
}
