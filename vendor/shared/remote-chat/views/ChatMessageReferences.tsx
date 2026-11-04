import { displayText } from '../../localization/browserClient';
import { useLanguage } from '../../localization/browserClient';
import type { messageReferences } from '../../chat/messageReferences';
import './messageReferences.css';

export function ChatMessageReferences({ references }: { references: ReturnType<typeof messageReferences> }) {
  useLanguage();
  if (!references.length) return null;
  return <div className="chat-message-references">
    {references.map(reference => <span className="chat-message-reference" key={reference.path}>
      {displayText(reference.label)}：{reference.name}
    </span>)}
  </div>;
}
