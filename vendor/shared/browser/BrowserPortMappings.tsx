import { useSyncExternalStore } from 'react';
import { Empty, Modal, theme } from 'antd';
import { ArrowLeftRight, ChevronRight } from 'lucide-react';
import { isTauri } from '@tauri-apps/api/core';
import type { Language } from '@remoteai/i18n';
import { browserMappings } from '../port-mapping/browserMappings';
import { marketText } from '../provider-market/i18n';
import { uiText } from '../localization/uiText';
import './browserPortMappings.css';

export function BrowserPortMappings({ language, close, visit }: {
  language: Language; close: () => void; visit: (url: string) => void;
}) {
  const entries = useSyncExternalStore(browserMappings.subscribe, browserMappings.snapshot);
  const t = marketText(language);
  const { token } = theme.useToken();
  return <Modal open className="browser-chrome" width={480} zIndex={1800} footer={null} onCancel={close}
    title={uiText('client.portForwarding.portMapping', {}, language)}>
    <p style={{ color: token.colorTextSecondary }}>{t('market.browserActiveMappingsHint')}</p>
    {!isTauri() && <p style={{ color: token.colorTextSecondary }}>
      {uiText('client.portMappingEditing.theLocalPortIsUsedByPhoneAndDesktopApps', {}, language)}</p>}
    {!entries.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('market.browserNoActiveMappings')} />}
    <div className="browser-port-mappings">
      {entries.map(entry => <button key={entry.id} type="button" onClick={() => { visit(entry.url); close(); }}
        style={{ borderColor: token.colorBorderSecondary, color: token.colorText }}>
        <ArrowLeftRight size={18} style={{ color: token.colorPrimary }} />
        <span><strong>{entry.url}</strong><small style={{ color: token.colorTextSecondary }}>{entry.target}</small></span>
        <ChevronRight size={16} />
      </button>)}
    </div>
  </Modal>;
}
