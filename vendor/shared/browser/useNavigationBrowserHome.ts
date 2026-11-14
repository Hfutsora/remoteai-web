import { useEffect, useState } from 'react';
import { browserHomeTransport } from './home/cache';

export interface BrowserHomeView { md5: string; url: string }
export interface BrowserHomeTransport {
  readCached: (baseUrl: string) => Promise<BrowserHomeView | null>;
  check: (baseUrl: string, signal: AbortSignal) => Promise<BrowserHomeView | null>;
}

/** Entering the navigation browser is the only trigger. Keep the previous complete version during updates. */
export function useNavigationBrowserHome(baseUrl: string | undefined, active: boolean,
  transport: BrowserHomeTransport = browserHomeTransport) {
  const [home, setHome] = useState<{ baseUrl: string; view: BrowserHomeView | null }>();
  useEffect(() => {
    if (!active || !baseUrl) return;
    const controller = new AbortController();
    const display = (view: BrowserHomeView | null) => {
      if (!controller.signal.aborted) setHome({ baseUrl, view });
    };
    void (async () => {
      try {
        const cached = await transport.readCached(baseUrl);
        if (cached) display(cached);
      } catch { /* Keep the in-memory last good version. */ }
      if (controller.signal.aborted) return;
      try { display(await transport.check(baseUrl, controller.signal)); }
      catch { /* Offline, failed and incomplete updates never replace the last good cache. */ }
    })();
    return () => controller.abort();
  }, [baseUrl, active, transport]);
  return home && home.baseUrl === baseUrl ? home.view?.url ?? '' : '';
}
