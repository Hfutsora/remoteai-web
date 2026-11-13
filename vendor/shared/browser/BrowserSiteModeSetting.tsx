import { Checkbox } from 'antd';
import { Monitor } from 'lucide-react';
import type { MarketText } from '../provider-market/i18n';

export function BrowserSiteModeSetting({ desktop, change, t, disabled = false }: {
  desktop: boolean; change: (desktop: boolean) => void; t: MarketText; disabled?: boolean;
}) {
  return <Checkbox className="browser-site-mode-setting" aria-label={t('market.browserDesktopSite')} checked={desktop}
    disabled={disabled}
    onChange={event => change(event.target.checked)}>
    <Monitor size={20} /><span>{t('market.browserDesktopSite')}</span>
  </Checkbox>;
}
