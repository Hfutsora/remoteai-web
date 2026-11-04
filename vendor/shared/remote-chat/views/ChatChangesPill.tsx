import { ChevronRight, FileText } from 'lucide-react';
import type { DiffFile } from '../../chat/diff';
import { summarizeDiffFiles } from '../../chat/diffSummary';
import { t } from '../../localization/browserClient';

export function ChatChangesPill({ files, onOpen }: { files: readonly DiffFile[]; onOpen: () => void }) {
  const { files: summary, added, removed } = summarizeDiffFiles(files);
  const count = summary.length;
  return <button type="button" className="chat-changes-pill"
    aria-label={t("client.chat.viewChangesFiles", { value1: count })} onClick={onOpen}>
    <FileText size={15} /><span>{t("client.downloads.editedFiles", { count })}</span>
    <span className="chat-added">+{added}</span>
    <span className="chat-removed">−{removed}</span>
    <ChevronRight size={14} />
  </button>;
}
