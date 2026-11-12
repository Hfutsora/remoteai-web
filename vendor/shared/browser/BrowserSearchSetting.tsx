import { Select, theme } from 'antd';
import type { MarketText } from '../provider-market/i18n';
import { searchEngines } from './searchEngine';
import type { useSearchEngine } from './useSearchEngine';

export function BrowserSearchSetting({ t, search }: { t: MarketText; search: ReturnType<typeof useSearchEngine> }) {
  const { token } = theme.useToken();
  return <>
    <div style={{ display: 'grid', gap: 6, width: '100%' }}><span>{t('market.browserSearchEngine')}</span>
      <Select aria-label={t('market.browserSearchEngine')} value={search.engine} onChange={search.select}
        style={{ width: '100%' }}
        options={searchEngines.map(engine => ({ value: engine.id, label: t(engine.label) }))}
        getPopupContainer={trigger => trigger.parentElement ?? document.body} />
    </div>
    {search.saveError && <span role="alert" style={{ color: token.colorError }}>
      {t('market.browserSearchSaveFailed')}</span>}
  </>;
}
