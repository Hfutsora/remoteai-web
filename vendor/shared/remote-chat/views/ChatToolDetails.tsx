import { displayText } from '../../localization/browserClient';
import { t, useLanguage } from '../../localization/browserClient';
import type { Item } from './types';
import { AdaptiveSheet } from '../../layout/AdaptiveSheet';
import { messageLabel } from '../../chat/messageDetails';
import { toolText } from '../../chat/toolText';
import { ChatQuoteButton } from './ChatQuotes';
import { ChatToolContent } from './ChatToolContent';
import { DeferredToolDetails } from '../../chat/DeferredToolDetails';
export function ChatToolDetails({ item, onClose, onBack, tabId }: {
  item: Item; onClose: () => void; onBack?: () => void; tabId?: string;
}) {
  useLanguage();
  return <AdaptiveSheet open tabId={tabId} title={displayText(messageLabel(item))} width={760} onClose={onClose} onBack={onBack}
    presentation={item.type === 'fileChange' ? 'drawer' : 'adaptive'}>
    <div className="chat-detail-stack">
      {item.status === 'inProgress' && <p className="chat-muted">{t("client.chat.inProgress.dbb151")}</p>}
      <DeferredToolDetails item={item}>{loaded => <>
        <ChatToolContent item={loaded} />
        <ChatQuoteButton messageId={loaded.id} role="tool" text={toolText(loaded)} onQuote={onClose} />
      </>}</DeferredToolDetails>
    </div>
  </AdaptiveSheet>;
}
