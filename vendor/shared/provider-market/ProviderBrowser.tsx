import { useCallback, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from 'antd';
import { ArrowLeft, ArrowRight, Globe, Maximize2, Minimize2, Plus, RotateCw, X } from 'lucide-react';
import { marketText, type MarketText } from './i18n';
import type { Language } from '@remoteai/i18n';
import { browserInput } from '../browser/addressInput';
import { useSearchEngine } from '../browser/useSearchEngine';
import { BrowserSearchSetting } from '../browser/BrowserSearchSetting';
import type { SearchEngine } from '../browser/searchEngine';
import type { BrowserAction, BrowserTab } from './browserState';
import { BrowserTabs } from './BrowserTabs';
import { ProviderWebsiteIcon } from './ProviderWebsiteIcon';
import { useBrowserBookmarks } from '../browser/bookmarks/useBrowserBookmarks';
import './providerBrowser.css';
import { isTauri } from '@tauri-apps/api/core';
import { useCompactBrowser } from '../browser/bookmarks/useCompactBrowser';
import { MobileBrowserToolbar, MobileTabManagerToolbar } from '../browser/MobileBrowserToolbar';
import { BrowserPages } from '../browser/BrowserPages';
import { BrowserSiteModeSetting } from '../browser/BrowserSiteModeSetting';
import { uiText } from '../localization/uiText';

export interface BrowserSurfaceProps {
  tab: BrowserTab; active: boolean; command: { sequence: number; action: BrowserAction } | null;
  onNavigate: (url: string) => void; t: MarketText;
  onPopup: (url: string) => void;
  onLoadingChange?: (loading: boolean) => void;
  hideForModal?: boolean;
}
export interface BrowserWindowProps {
  title?: string;
  open: boolean; tabs: BrowserTab[]; activeId: string; language: Language;
  onSelect: (id: string) => void; onCloseTab: (id: string) => void; onNewTab: () => void; onClose: () => void;
  onCloseTabs: (ids: string[]) => void;
  onNavigate: (id: string, url: string) => void; onAction: (id: string, action: BrowserAction) => void;
  onPopup: (id: string, url: string) => void;
  commands: Record<string, BrowserSurfaceProps['command']>; Surface: ComponentType<BrowserSurfaceProps>;
}

function BrowserToolbar({ tab, loading, fullscreen, toggleFullscreen, navigate, action, t, actions, star, settings,
  searchEngine }: {
  loading: boolean;
  tab?: BrowserTab; fullscreen: boolean; toggleFullscreen: () => void;
  navigate: (url: string) => void; action: (action: BrowserAction) => void; t: MarketText; actions?: ReactNode;
  star?: ReactNode; settings?: ReactNode;
  searchEngine: SearchEngine;
}) {
  const [address, setAddress] = useState(tab?.url ?? '');
  const [invalid, setInvalid] = useState(false);
  useEffect(() => { setAddress(tab?.url ?? ''); setInvalid(false); }, [tab?.id, tab?.url]);
  return <div className="pm-browser-toolbar">
    <button aria-label={t('market.browserBack')} title={t('market.browserBack')}
      disabled={!tab?.url} onClick={() => action('back')}><ArrowLeft size={17} /></button>
    <button aria-label={t('market.browserForward')} title={t('market.browserForward')}
      disabled={!tab?.url} onClick={() => action('forward')}><ArrowRight size={17} /></button>
    <button aria-label={t(loading ? 'market.cancel' : 'market.browserReload')}
      title={t(loading ? 'market.cancel' : 'market.browserReload')}
      disabled={!tab?.url} onClick={() => action(loading ? 'stop' : 'reload')}>
      {loading ? <X size={17} /> : <RotateCw size={17} />}</button>
    <form onSubmit={(event) => {
      event.preventDefault();
      if (tab?.url.startsWith('file:') && address.trim() === tab.url) {
        setInvalid(false); action('reload'); return;
      }
      const url = browserInput(address, searchEngine);
      setInvalid(!url);
      if (url) { setAddress(url.href); navigate(url.href); }
    }}>
      <ProviderWebsiteIcon url={tab?.url} size={15} fallback={<Globe size={15} />} />
      <input aria-label={t('market.browserAddress')} aria-invalid={invalid}
        value={address} onChange={(event) => { setAddress(event.target.value); setInvalid(false); }}
        placeholder={t('market.browserSearchOrAddress')} spellCheck={false} autoComplete="off" />
      {star}<button type="submit" aria-label={t('market.visitPage')}><ArrowRight size={16} /></button>
    </form>
    {actions}
    <button aria-label={t(fullscreen ? 'market.browserRestore' : 'market.browserFullscreen')}
      title={t(fullscreen ? 'market.browserRestore' : 'market.browserFullscreen')} onClick={toggleFullscreen}>
      {fullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
    {settings}
    {invalid && <span className="pm-browser-address-error" role="alert">{t('market.browserInvalidUrl')}</span>}
  </div>;
}

/** Browser chrome shared by the Provider dialog and the conversation sidebar. */
export function BrowserContents(props: BrowserWindowProps & {
  fullscreen: boolean; toggleFullscreen: () => void; embedded?: boolean; actions?: ReactNode;
  onPageNavigate?: (id: string, url: string) => void; history?: ReactNode;
}) {
  const { tabs, activeId, open } = props;
  const t = marketText(props.language);
  const tab = tabs.find((entry) => entry.id === activeId);
  const search = useSearchEngine();
  const narrow = useCompactBrowser();
  const compact = narrow && !isTauri();
  const [manager, setManager] = useState(false);
  const [query, setQuery] = useState('');
  const [desktopTabs, setDesktopTabs] = useState<Record<string, boolean>>({});
  const showManager = compact && manager;
  const add = () => { props.onNewTab(); setManager(false); setQuery(''); };
  useEffect(() => { if (!open) setManager(false); }, [open]);
  useEffect(() => {
    if (!compact || !open) return;
    const previous = document.documentElement.style.overscrollBehaviorX;
    document.documentElement.style.overscrollBehaviorX = 'none';
    return () => { document.documentElement.style.overscrollBehaviorX = previous; };
  }, [compact, open]);
  const bookmarks = useBrowserBookmarks({ tab, t,
    settingsContent: <>
      {compact && <BrowserSiteModeSetting desktop={!!desktopTabs[activeId]} t={t}
        change={desktop => setDesktopTabs(current => ({ ...current, [activeId]: desktop }))} />}
      {compact && <Button block disabled={!tab?.url} onClick={() => {
        if (tab?.url) window.open(tab.url, '_blank', 'noopener,noreferrer');
      }}>{uiText('client.workspaceActions.openInBrowser', {}, props.language)}</Button>}
      <BrowserSearchSetting t={t} search={search} />
    </>,
    close: props.onClose,
    navigate: url => { if (tab) props.onNavigate(tab.id, url); },
    newTab: url => { if (tab) props.onPopup(tab.id, url); },
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingTabs, setLoadingTabs] = useState<ReadonlySet<string>>(() => new Set());
  const loadingChanged = useCallback((id: string, loading: boolean) => {
    setLoadingTabs(current => {
      if (current.has(id) === loading) return current;
      const next = new Set(current);
      if (loading) next.add(id); else next.delete(id);
      return next;
    });
  }, []);
  useEffect(() => {
    setLoadingTabs(current => {
      const next = new Set([...current].filter(id => tabs.some(entry => entry.id === id)));
      return next.size === current.size ? current : next;
    });
  }, [tabs]);
  return <>
    {!compact && <div className="pm-browser-titlebar">{props.history}
    <BrowserTabs tabs={tabs} activeId={activeId} visible={open} t={t}
      select={props.onSelect} close={props.onCloseTab} closeTabs={props.onCloseTabs} menuChanged={setMenuOpen} />
    <button aria-label={t('market.browserNewTab')} title={t('market.browserNewTab')}
      onClick={props.onNewTab}><Plus size={17} /></button>
    {!props.embedded && <button className="pm-browser-close" aria-label={t('market.close')} title={t('market.close')}
      onClick={props.onClose}><X size={19} /></button>}</div>}
    {showManager ? <MobileTabManagerToolbar t={t} count={tabs.length} query={query} setQuery={setQuery}
      close={() => setManager(false)} add={add} /> : compact
      ? <MobileBrowserToolbar tab={tab} t={t} engine={search.engine} count={tabs.length}
        newTab={add} manage={() => { setQuery(''); setManager(true); }} settings={bookmarks.settings}
        navigate={url => { if (tab) props.onNavigate(tab.id, url); }}
        action={action => { if (tab) props.onAction(tab.id, action); }} />
      : <BrowserToolbar tab={tab} loading={Boolean(tab && loadingTabs.has(tab.id))}
      searchEngine={search.engine}
      fullscreen={props.fullscreen} toggleFullscreen={props.toggleFullscreen}
      navigate={(url) => { if (tab) props.onNavigate(tab.id, url); }}
      action={(action) => { if (tab) props.onAction(tab.id, action); }} t={t} actions={props.actions}
      star={bookmarks.star} settings={bookmarks.settings} />}
    {!showManager && bookmarks.bar}{bookmarks.overlays}
    <BrowserPages key="pages" browser={props} t={t} manager={showManager} compact={compact} query={query}
      desktopTabs={desktopTabs}
      blocked={menuOpen || bookmarks.overlayOpen} loadingChanged={loadingChanged}
      select={id => { props.onSelect(id); setManager(false); }} />
  </>;
}

export function ProviderBrowser(props: BrowserWindowProps) {
  const { open } = props;
  const [fullscreen, setFullscreen] = useState(false);
  const t = marketText(props.language);
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.current?.focus();
    return () => { previous?.focus(); };
  }, [open]);
  return createPortal(<div className="pm-browser-backdrop" hidden={!open}>
    <section ref={dialog} role="dialog" aria-modal="true" aria-label={props.title ?? t('market.browserTitle')} tabIndex={-1}
      className={`pm-browser${fullscreen ? ' pm-browser-fullscreen' : ''}`} onKeyDown={(event) => {
        if (event.key === 'Escape') { event.stopPropagation(); fullscreen ? setFullscreen(false) : props.onClose(); }
        if (event.key === 'Tab') {
          const elements = [...(dialog.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input, iframe') ?? [])].filter((element) => element.getClientRects().length);
          const first = elements[0]; const last = elements.at(-1);
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
      }}>
      <BrowserContents {...props} fullscreen={fullscreen} toggleFullscreen={() => setFullscreen(value => !value)} />
    </section>
  </div>, document.body);
}
