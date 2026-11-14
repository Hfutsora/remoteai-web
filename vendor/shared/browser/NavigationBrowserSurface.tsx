import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { BrowserSurfaceProps } from '../provider-market/ProviderBrowser';
import { ResourceBrowserSurface } from '../file-preview/workspace/browserResources';
import './navigationBrowserHome.css';

export const NavigationBrowserHomeContext = createContext('');

export function NavigationBrowserSurface(props: BrowserSurfaceProps) {
  const homeUrl = useContext(NavigationBrowserHomeContext);
  if (!homeUrl || props.tab.url) return <ResourceBrowserSurface {...props} />;
  return <CustomBrowserHome {...props} url={homeUrl} />;
}

function CustomBrowserHome(props: BrowserSurfaceProps & { url: string }) {
  const { url, active, obscured, onNavigate, onPopup, t } = props;
  const [shown, setShown] = useState<string>();
  const frames = useRef(new Map<string, HTMLIFrameElement>());
  useEffect(() => {
    const navigate = (event: MessageEvent<unknown>) => {
      if (!active || obscured || !shown || event.source !== frames.current.get(shown)?.contentWindow
        || event.origin !== 'null') return;
      const data = event.data;
      if (!data || typeof data !== 'object' || !('type' in data)
        || data.type !== 'remoteai:browser-home:navigate' || !('url' in data) || typeof data.url !== 'string') return;
      try {
        const target = new URL(data.url);
        if (!['https:', 'http:'].includes(target.protocol)) return;
        if ('newTab' in data && data.newTab === true) onPopup(target.href); else onNavigate(target.href);
      } catch { /* Ignore malformed messages from the uploaded page. */ }
    };
    window.addEventListener('message', navigate);
    return () => window.removeEventListener('message', navigate);
  }, [active, obscured, onNavigate, onPopup, shown]);
  const urls = shown && shown !== url ? [shown, url] : [url];
  return <div className="browser-home-stack">
    {!shown && <ResourceBrowserSurface {...props} />}
    {urls.map(source => <iframe key={source} ref={element => {
      if (element) frames.current.set(source, element); else frames.current.delete(source);
    }} className="browser-custom-home" src={source} title={t('market.browserHome')}
      hidden={shown !== source} onLoad={() => { if (source === url) setShown(source); }}
      sandbox="allow-scripts" referrerPolicy="no-referrer" />)}
  </div>;
}
