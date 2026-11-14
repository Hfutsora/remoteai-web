import { useSyncExternalStore } from 'react';
import { Empty, Modal, theme } from 'antd';
import { ArrowLeftRight, ChevronRight } from 'lucide-react';
import { isTauri } from '@tauri-apps/api/core';
import type { Language } from '@remoteai/i18n';
import { browserMappings } from '../port-mapping/browserMappings';
import { marketText } from '../provider-market/i18n';
import { uiText } from '../localization/uiText';
import { BrowserSettingsAction } from './BrowserSettings';
import { BrowserSettingsSubmenu } from './BrowserSettingsSubmenu';
import './browserPortMappings.css';

interface MappingChoicesProps {
  language: Language; close: () => void; visit: (url: string) => void;
}

export function BrowserPortMappingsSetting({ compact, showDialog, ...props }: MappingChoicesProps & {
  compact: boolean; showDialog: () => void;
}) {
  const title = uiText('client.portForwarding.portMapping', {}, props.language);
  if (compact) return <BrowserSettingsAction icon={ArrowLeftRight} trailing={<ChevronRight size="1.1em" />}
    onClick={() => { props.close(); showDialog(); }}>{title}</BrowserSettingsAction>;
  return <BrowserSettingsSubmenu icon={ArrowLeftRight} title={title}>
    <BrowserPortMappingChoices {...props} submenu />
  </BrowserSettingsSubmenu>;
}

export function BrowserPortMappings(props: MappingChoicesProps) {
  return <Modal open className="browser-chrome" width={480} zIndex={1800} footer={null} onCancel={props.close}
    title={uiText('client.portForwarding.portMapping', {}, props.language)}>
    <BrowserPortMappingChoices {...props} />
  </Modal>;
}

function BrowserPortMappingChoices({ language, close, visit, submenu = false }: MappingChoicesProps & {
  submenu?: boolean;
}) {
  const entries = useSyncExternalStore(browserMappings.subscribe, browserMappings.snapshot);
  const t = marketText(language);
  const { token } = theme.useToken();
  return <>
    <p className={submenu ? 'browser-settings-submenu-hint' : undefined}
      style={{ color: token.colorTextSecondary }}>{t('market.browserActiveMappingsHint')}</p>
    {!isTauri() && <p className={submenu ? 'browser-settings-submenu-hint' : undefined}
      style={{ color: token.colorTextSecondary }}>
      {uiText('client.portMappingEditing.theLocalPortIsUsedByPhoneAndDesktopApps', {}, language)}</p>}
    {!entries.length && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('market.browserNoActiveMappings')} />}
    <div className={`browser-port-mappings${submenu ? ' browser-port-mappings-submenu' : ''}`}>
      {entries.map(entry => <button key={entry.id} type="button" role={submenu ? 'menuitem' : undefined}
        onClick={() => { visit(entry.url); close(); }}
        style={{ borderColor: token.colorBorderSecondary, color: token.colorText }}>
        <ArrowLeftRight size={18} style={{ color: token.colorPrimary }} />
        <span><strong>{entry.url}</strong><small style={{ color: token.colorTextSecondary }}>{entry.target}</small></span>
        <ChevronRight size={16} />
      </button>)}
    </div>
  </>;
}
