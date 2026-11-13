import { Select, theme } from 'antd';
import { Search } from 'lucide-react';
import type { MarketText } from '../provider-market/i18n';
import { searchEngines } from './searchEngine';
import type { useSearchEngine } from './useSearchEngine';

export function BrowserSearchSetting({ t, search }: { t: MarketText; search: ReturnType<typeof useSearchEngine> }) {
  const { token } = theme.useToken();
  return <>
    <div className="browser-settings-row browser-settings-search"><Search size="1.25em" />
      <span className="browser-settings-label">{t('market.browserSearchEngine')}</span>
      <Select aria-label={t('market.browserSearchEngine')} value={search.engine} onChange={search.select}
        variant="borderless" popupMatchSelectWidth={false}
        options={searchEngines.map(engine => ({ value: engine.id, label: t(engine.label) }))}
        getPopupContainer={trigger => trigger.parentElement ?? document.body} />
    </div>
    {search.saveError && <span role="alert" style={{ color: token.colorError }}>
      {t('market.browserSearchSaveFailed')}</span>}
  </>;
}
