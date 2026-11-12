import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { X } from 'lucide-react';
import type { BrowserWindowProps } from '../provider-market/ProviderBrowser';
import type { MarketText } from '../provider-market/i18n';
import { ProviderWebsiteIcon } from '../provider-market/ProviderWebsiteIcon';
import { BrowserEdgeGestures } from './BrowserEdgeGestures';
import './mobileBrowser.css';

/** Change the layout around the existing surfaces so previews never remount a tab's iframe. */
export function BrowserPages({ browser, t, manager, compact, query, blocked, select, loadingChanged }: {
  browser: BrowserWindowProps & { embedded?: boolean; onPageNavigate?: (id: string, url: string) => void };
  t: MarketText; manager: boolean; compact: boolean; query: string; blocked: boolean;
  select: (id: string) => void; loadingChanged: (id: string, loading: boolean) => void;
}) {
  const { tabs, activeId, Surface, commands, open } = browser;
  const host = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ width: 390, height: 650 });
  useLayoutEffect(() => {
    if (manager || !open || !host.current) return;
    const element = host.current;
    const measure = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width && height) setViewport({ width, height });
    };
    measure();
    const observer = new ResizeObserver(measure); observer.observe(element);
    return () => observer.disconnect();
  }, [manager, open]);
  const match = (title: string, url: string) => `${title} ${url}`.toLocaleLowerCase().includes(query.toLocaleLowerCase());
  const previewStyle = { '--browser-preview-width': `${viewport.width}px`,
    '--browser-preview-height': `${viewport.height}px`,
    '--browser-preview-scale': Math.max(0.1, (viewport.width - 48) / 2 / viewport.width) } as CSSProperties;
  return <div ref={host} className={`pm-browser-pages${manager ? ' browser-tab-grid' : ''}`} style={previewStyle}>
    {tabs.map(entry => {
      const title = entry.title || entry.url || t('market.browserNewTab');
      return <div key={entry.id} id={`page-${entry.id}`} role={manager ? 'group' : 'tabpanel'}
        className={`pm-browser-page${entry.id === activeId ? ' browser-tab-selected' : ''}`}
        hidden={manager ? !match(title, entry.url) : entry.id !== activeId}>
        {manager && <div className="browser-tab-card-header"><ProviderWebsiteIcon url={entry.url} size={16} />
          <span>{title}</span><button aria-label={t('market.browserCloseTab', { name: title })}
            onClick={() => browser.onCloseTab(entry.id)}><X size={18} /></button></div>}
        <div key="surface" className="browser-tab-canvas" aria-hidden={manager || undefined}
          ref={element => { if (element) element.inert = manager; }}>
          <Surface tab={entry} active={open && entry.id === activeId && !blocked && !manager}
            command={commands[entry.id] ?? null} hideForModal={browser.embedded}
            onNavigate={url => (browser.onPageNavigate ?? browser.onNavigate)(entry.id, url)}
            onPopup={url => browser.onPopup(entry.id, url)}
            onLoadingChange={loading => loadingChanged(entry.id, loading)} t={t} />
        </div>
        {manager && <><button className="browser-tab-select" aria-label={title} aria-pressed={entry.id === activeId}
          onClick={() => select(entry.id)} /><span className="browser-tab-card-url">{entry.url || title}</span></>}
      </div>;
    })}
    {manager && !tabs.some(entry => match(entry.title || t('market.browserNewTab'), entry.url))
      && <p className="browser-tab-empty">{t('market.browserNoMatchingTabs')}</p>}
    {compact && !manager && !blocked && <BrowserEdgeGestures action={action => browser.onAction(activeId, action)} />}
  </div>;
}
