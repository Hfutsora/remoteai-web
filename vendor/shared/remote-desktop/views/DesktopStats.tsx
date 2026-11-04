import { displayText } from '../../localization/browserClient';
import { X } from 'lucide-react';
import type { DesktopStats as Stats } from '../protocol';
import { desktopStatsLines } from '../stats';
import { t } from '../../localization/browserClient';

export function DesktopStats({ stats, close }: { stats: Stats; close: () => void }) {
  return <div className="rd-stats">
    <span aria-label={t("client.remoteDesktop.connectionStats")}>{desktopStatsLines(stats, displayText).join('\n')}</span>
    <button aria-label={t("client.remoteDesktop.closeConnectionStats")} onClick={close}><X size={18} /></button>
  </div>;
}
