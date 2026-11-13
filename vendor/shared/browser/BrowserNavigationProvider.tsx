import { createContext, useMemo, type ReactNode } from 'react';
import { useWebsiteTabs } from '../file-preview/workspace/useWebsiteTabs';
import type { BrowserResource } from '../file-preview/workspace/browserResources';

export const BrowserNavigationContext = createContext<{
  browser: ReturnType<typeof useWebsiteTabs>;
  openWebsite: (url: string, options?: { resolved?: boolean; resolve?: (url: string) => Promise<string> }) => void;
  openResource: (resource: BrowserResource) => void;
} | null>(null);

/** Application-owned tabs survive leaving a conversation and reserve a new tab for every preview click. */
export function BrowserNavigationProvider({ children, onOpen }: { children: ReactNode; onOpen: () => void }) {
  const browser = useWebsiteTabs({ reuseTabs: false });
  const value = useMemo(() => ({ browser,
    openWebsite: (url: string, options?: { resolved?: boolean; resolve?: (url: string) => Promise<string> }) => {
      browser.open(url, options?.resolved, options?.resolve); onOpen();
    },
    openResource: (resource: BrowserResource) => { browser.openResource(resource); onOpen(); },
  }), [browser, onOpen]);
  return <BrowserNavigationContext.Provider value={value}>{children}</BrowserNavigationContext.Provider>;
}
