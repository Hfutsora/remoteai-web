import { useContext, useEffect, useRef, useState } from 'react';
import type { Language } from '@remoteai/i18n';
import { BrowserContents } from '../provider-market/ProviderBrowser';
import { BrowserResourcesContext, ResourceBrowserSurface } from '../file-preview/workspace/browserResources';
import { BrowserNavigationContext } from './BrowserNavigationProvider';
import { useWebsiteTabs } from '../file-preview/workspace/useWebsiteTabs';
import { marketText } from '../provider-market/i18n';
import './browserPage.css';

/** Reuse the established engine and tabs without tying the main browser to a conversation. */
export function BrowserPage({ language, active = true, onClose }: {
  language: Language; active?: boolean; onClose?: () => void;
}) {
  const navigation = useContext(BrowserNavigationContext);
  const standalone = useWebsiteTabs();
  const browser = navigation?.browser ?? standalone;
  const [expanded, setExpanded] = useState(false);
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    if (!browser.tabs.length) browser.onNewTab();
  }, [browser.onNewTab]);
  const closeTabs = (ids: string[]) => {
    browser.onCloseTabs(ids);
    if (browser.tabs.every(tab => ids.includes(tab.id))) browser.onNewTab();
  };
  return <BrowserResourcesContext.Provider value={browser.resources}>
    <section hidden={!active} className={`pm-browser browser-main-page${expanded ? ' browser-main-expanded' : ''}`}
    aria-label={marketText(language)('market.browserNavigation')}>
    <BrowserContents {...browser} embedded mainBrowser language={language} open={active} Surface={ResourceBrowserSurface}
      onCloseTab={id => closeTabs([id])} onCloseTabs={closeTabs}
      onClose={() => { setExpanded(false); onClose?.(); }}
      fullscreen={expanded} toggleFullscreen={() => setExpanded(value => !value)} />
  </section></BrowserResourcesContext.Provider>;
}
