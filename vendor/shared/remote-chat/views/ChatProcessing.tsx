import { useProcessingStatus, type ChatProcessingProps }
  from '../client/useProcessingStatus';
import { useLanguage } from '../../localization/browserClient';

export function ChatProcessing(props: ChatProcessingProps) {
  useLanguage();
  const { phase, label } = useProcessingStatus(props);
  return <p role="status" data-processing-phase={phase} className="chat-processing chat-processing-status chat-muted">
    <span className="chat-spinner" aria-hidden="true" /><span className="chat-processing-label">{label}</span>
  </p>;
}
