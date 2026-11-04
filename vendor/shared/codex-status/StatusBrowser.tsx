import { useEffect } from 'react';
import { isTauri } from '@tauri-apps/api/core';
import { ProviderBrowser } from '../provider-market/ProviderBrowser';
import { ProviderBrowserSurface } from '../browser/managed/ProviderBrowserSurface';
import { useWebsiteTabs } from '../file-preview/workspace/useWebsiteTabs';
import { getInterfaceLanguage } from '../localization/interfaceLanguage';
import { displayText } from '../localization/messages';
import { CODEX_STATUS_URL } from './status';
import { RemoteStatusSurface } from './RemoteStatusSurface';

export function StatusBrowser({ active, onClose }: { active: boolean; onClose: () => void }) {
  const browser = useWebsiteTabs();
  useEffect(() => { browser.open(CODEX_STATUS_URL, true); }, [browser.open]);
  return <ProviderBrowser {...browser} open={active} language={getInterfaceLanguage()}
    title={displayText('client.codexStatus.title')} Surface={isTauri() ? ProviderBrowserSurface : RemoteStatusSurface}
    onClose={onClose} onCloseTab={id => {
      browser.onCloseTab(id);
      if (browser.tabs.length === 1) onClose();
    }} onCloseTabs={ids => {
      browser.onCloseTabs(ids);
      if (browser.tabs.every(tab => ids.includes(tab.id))) onClose();
    }} />;
}
