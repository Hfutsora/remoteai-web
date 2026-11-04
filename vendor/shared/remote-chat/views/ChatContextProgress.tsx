import { Settings } from 'lucide-react';
import { contextUsage } from '../../context-usage/values';
import { remainingStroke } from '../../quota';
import { t } from '../../localization/browserClient';
import { contextUsageLabel } from './formatters';
import type { ThreadTokenUsage } from './types';
import './chatContextProgress.css';

export function ChatContextProgress({ usage, onSettings, disabled }: {
  usage?: ThreadTokenUsage; onSettings?: () => void; disabled: boolean;
}) {
  const label = contextUsageLabel(usage);
  const percent = contextUsage(usage)?.percent ?? undefined;
  return <span className="chat-context-progress">
    <span className="chat-context-progress-track" role="progressbar" aria-label={label}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent} aria-valuetext={label}>
      {percent !== undefined && <span style={{ width: `${percent}%`,
        backgroundColor: remainingStroke(100 - percent) }} />}
    </span>
    <span className="chat-context-progress-content"><span>{label}</span>{onSettings && <>{'\u00a0'}
      <button type="button" aria-label={t('client.chat.conversationContext')}
        disabled={disabled} onClick={onSettings}><Settings size={14} /></button>
    </>}</span>
  </span>;
}
