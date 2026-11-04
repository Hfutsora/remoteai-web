import type { UsageSummary } from '../usage';
import type { ConversationMetrics } from '../conversationMetrics';
import { UsageFooter } from '../../chat/UsageFooter';
import { t, useLanguage } from '../../localization/browserClient';
import type { ComposerProps } from './composerProps';
import { ConversationPerformanceValues } from './ConversationPerformance';
import './composerFooter.css';
import { CodexVersionStatus } from '../../codex-status/CodexVersionStatus';
import type { ReadCodexServiceStatus } from '../../codex-status/status';

type Props = Pick<ComposerProps, 'connectionInfo'>
  & { desktop: boolean; cliVersion?: string | null; usage?: UsageSummary | null; metrics?: ConversationMetrics | null;
    readServiceStatus?: ReadCodexServiceStatus; statusActive?: boolean; statusConnected?: boolean };

export function ComposerFooter({ desktop, cliVersion, connectionInfo,
  usage = null, metrics = null, readServiceStatus, statusActive = true, statusConnected = false }: Props) {
  useLanguage();
  if (!desktop && !connectionInfo) return null;
  return <div className="chat-composer-hint cs-usage-footer-container">
    {desktop && <CodexVersionStatus version={cliVersion} read={readServiceStatus}
      active={statusActive} connected={statusConnected} t={t} />}
    <div className="chat-composer-details">
      {connectionInfo}
      {desktop && <span className="chat-conversation-metrics">
        <UsageFooter usage={usage} translate={t}>
          <ConversationPerformanceValues metrics={metrics} />
        </UsageFooter>
      </span>}
    </div>
  </div>;
}
