import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import type { BrowserAction, BrowserTab } from '../provider-market/browserState';
import type { MarketText } from '../provider-market/i18n';
import { browserInput } from './addressInput';
import type { SearchEngine } from './searchEngine';

export function MobileBrowserToolbar({ tab, t, engine, navigate, action, count, newTab, manage, settings }: {
  tab?: BrowserTab; t: MarketText; engine: SearchEngine; navigate: (url: string) => void;
  action: (action: BrowserAction) => void; count: number; newTab: () => void; manage: () => void;
  settings: ReactNode;
}) {
  const [address, setAddress] = useState(tab?.url ?? '');
  const [invalid, setInvalid] = useState(false);
  useEffect(() => { setAddress(tab?.url ?? ''); setInvalid(false); }, [tab?.id, tab?.url]);
  return <div className="pm-browser-toolbar browser-mobile-toolbar">
    <button aria-label={t('market.browserBack')} disabled={!tab || tab.historyIndex <= 0}
      onClick={() => action('back')}><ArrowLeft size={18} /></button>
    <button aria-label={t('market.browserForward')} disabled={!tab || tab.historyIndex >= tab.history.length - 1}
      onClick={() => action('forward')}><ArrowRight size={18} /></button>
    <form onSubmit={event => {
      event.preventDefault();
      const url = browserInput(address, engine);
      setInvalid(!url);
      if (url) { navigate(url.href); (document.activeElement as HTMLElement | null)?.blur(); }
    }}>
      <input aria-label={t('market.browserAddress')} aria-invalid={invalid} placeholder={t('market.browserSearchOrAddress')}
        value={address} onChange={event => { setAddress(event.target.value); setInvalid(false); }}
        spellCheck={false} autoComplete="off" enterKeyHint="go" />
    </form>
    <button aria-label={t('market.browserNewTab')} onClick={newTab}><Plus size={23} /></button>
    <button aria-label={t('market.browserManageTabs', { count })} onClick={manage}>
      <span className="browser-tab-count">{count}</span></button>
    {settings}
    {invalid && <span className="pm-browser-address-error" role="alert">{t('market.browserInvalidUrl')}</span>}
  </div>;
}

export function MobileTabManagerToolbar({ t, count, query, setQuery, close, add }: {
  t: MarketText; count: number; query: string; setQuery: (value: string) => void; close: () => void; add: () => void;
}) {
  return <div className="browser-tab-manager-toolbar">
    <div><button aria-label={t('market.browserReturnToPage')} onClick={close}><ArrowLeft size={22} /></button>
      <strong>{t('market.browserTabs')} ({count})</strong>
      <button aria-label={t('market.browserNewTab')} onClick={add}><Plus size={24} /></button></div>
    <input aria-label={t('market.browserSearchTabs')} placeholder={t('market.browserSearchTabs')}
      value={query} onChange={event => setQuery(event.target.value)} />
  </div>;
}
