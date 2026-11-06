import { useLanguage } from '../../../../shared/localization/browserClient';
import type { TokenSummary } from '../../../../shared/remote-chat/tokenSummary';
import { officialUsageLabels } from '@remoteai/i18n/copy/client/officialUsageLabels';
import { OfficialUsageChart } from '../../../../shared/token-usage/OfficialUsageChart';

export function OfficialUsagePanel({ data }: { data: TokenSummary }) {
  const language = useLanguage();
  const labels = officialUsageLabels(language);
  const usage = data.officialUsage;
  if (!usage) return null;
  return <section className="chat-token-card"><h3>{labels.title}</h3>
    <p className="chat-muted">{usage.status === 'unavailable' ? labels.unavailableStatus
      : usage.status === 'signedOut' ? labels.signedOut : labels.ready}</p>
    <p className="chat-muted">{labels.hint}</p>
    <OfficialUsageChart accounts={usage.accounts} language={language} />
  </section>;
}
