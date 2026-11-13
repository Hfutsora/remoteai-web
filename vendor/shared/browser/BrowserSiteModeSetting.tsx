import { Checkbox } from 'antd';
import { Monitor } from 'lucide-react';
import type { MarketText } from '../provider-market/i18n';

export function BrowserSiteModeSetting({ desktop, change, t }: {
  desktop: boolean; change: (desktop: boolean) => void; t: MarketText;
}) {
  return <Checkbox className="browser-site-mode-setting" aria-label={t('market.browserDesktopSite')} checked={desktop}
    onChange={event => change(event.target.checked)}>
    <Monitor size={20} /><span>{t('market.browserDesktopSite')}</span>
  </Checkbox>;
}
