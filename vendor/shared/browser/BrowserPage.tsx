import { useEffect, useRef, useState } from 'react';
import type { Language } from '@remoteai/i18n';
import { BrowserContents } from '../provider-market/ProviderBrowser';
import { ProviderBrowserSurface } from './managed/ProviderBrowserSurface';
import { useWebsiteTabs } from '../file-preview/workspace/useWebsiteTabs';
import { marketText } from '../provider-market/i18n';
import './browserPage.css';

/** Reuse the established engine and tabs without tying the main browser to a conversation. */
export function BrowserPage({ language, active = true }: { language: Language; active?: boolean }) {
  const browser = useWebsiteTabs();
  const [expanded, setExpanded] = useState(false);
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true; browser.onNewTab();
  }, [browser.onNewTab]);
  const closeTabs = (ids: string[]) => {
    browser.onCloseTabs(ids);
    if (browser.tabs.every(tab => ids.includes(tab.id))) browser.onNewTab();
  };
  return <section hidden={!active} className={`pm-browser browser-main-page${expanded ? ' browser-main-expanded' : ''}`}
    aria-label={marketText(language)('market.browserNavigation')}>
    <BrowserContents {...browser} embedded language={language} open={active} Surface={ProviderBrowserSurface}
      onCloseTab={id => closeTabs([id])} onCloseTabs={closeTabs} onClose={() => setExpanded(false)}
      fullscreen={expanded} toggleFullscreen={() => setExpanded(value => !value)} />
  </section>;
}
