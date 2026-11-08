import { displayText } from '../../localization/browserClient';
import { t, useLanguage } from '../../localization/browserClient';
import { useState, type ReactNode } from 'react';
import { ChevronRight, FileText, Lightbulb, Search, Terminal, Users, Wrench } from 'lucide-react';
import { ChatToolContent } from './ChatToolContent';
import { ActivityList } from '../../chat/ActivityList';
import { useDesktopLayout } from '../../layout/useDesktopLayout';
import type { Item } from './types';
import { messageContent, messageLabel } from '../../chat/messageDetails';
import { commandPreview } from '../../chat/commandPreview';
import { activityPreview } from '../../chat/activityPreview';
import { commandStatusLabel, useToolSummary } from '../../chat/useToolSummary';
import { isItemFinished } from '../../conversation/itemStatus';
import { collaborationSummary, isCollaborationActivity }
  from '../../conversation/collaborationActivity';

const STATUS: Record<string, string> = { get inProgress() { return t("client.chat.inProgress"); }, get completed() { return t("client.chat.completed"); }, get failed() { return t("client.taskReview.failed"); },
  get declined() { return t("client.chat.declined"); }, get interrupted() { return t("client.chat.stopped"); } };

function activityLabel(item: Item) {
  if (isCollaborationActivity(item)) return collaborationSummary(item, displayText);
  if (item.type === 'commandExecution') {
    const action = item.commandActions?.find(entry => entry.type !== 'unknown');
    const labels: Record<string, string> = { read: t("client.chat.readFile"), listFiles: t("client.chat.browseFiles"), search: t("client.chat.searchCode") };
    return action ? `${labels[action.type] || t("client.chat.runCommand")} · ${action.name || action.query || action.path || ''}`
      : [commandStatusLabel(item.status), commandPreview(item.commandPreview ?? item.command ?? '')]
        .filter(Boolean).join(' · ');
  }
  if (item.type === 'reasoning') return [...item.summary ?? [], messageContent(item)]
    .join('\n').trim().split('\n')[0].replace(/[*_`#]/g, '');
  const detail = item.type === 'fileChange'
    ? item.changes?.map(change => change.path.split(/[\\/]/).at(-1)).join('、')
    : item.query || item.tool || item.review || item.text || item.path;
  return [displayText(messageLabel(item)), detail, STATUS[item.status ?? '']].filter(Boolean).join(' · ');
}

function GroupedActivities({ children }: { children: ReactNode }) {
  const desktop = useDesktopLayout();
  const className = 'chat-inline-tool-content chat-detail-stack';
  return desktop ? <ActivityList className={className}
    rowSelector=":scope > .chat-inline-activity > .chat-activity">{children}</ActivityList>
    : <div className={className}>{children}</div>;
}

export function ChatActivity({ item: source, onOpen, running, inline = false, onInspect, count, content }: {
  item: Item; onOpen: (id: string) => void; running?: boolean;
  inline?: boolean; onInspect?: () => void; count?: number; content?: () => ReactNode;
}) {
  useLanguage();
  const { item, onLoad } = useToolSummary(source);
  const [expanded, setExpanded] = useState(false);
  const label = activityPreview(activityLabel(item));
  if (!label) return null;
  const icons = { commandExecution: Terminal, fileChange: FileText, reasoning: Lightbulb, webSearch: Search };
  const Icon = isCollaborationActivity(item) ? Users : icons[item.type as keyof typeof icons] || Wrench;
  return <div className={inline ? 'chat-inline-activity' : undefined}>
    <button type="button" className={`chat-activity${running && !isItemFinished(item.status) ? ' is-running' : ''}`}
      aria-label={count ? t("client.downloads.viewGroupedOperationsActivities", { value1: count }) : undefined}
      aria-expanded={inline ? expanded : undefined} onClick={() => {
        if (!inline) return onOpen(item.id);
        if (!expanded) onInspect?.();
        setExpanded(value => !value);
      }}><Icon size={16} color={item.status === 'failed' ? 'var(--danger, #c24047)' : undefined} />
      <span className="chat-activity-text">{label}</span>
      {count && <span className="chat-activity-count">{count}</span>}<ChevronRight size={15} /></button>
    {inline && expanded && (count && content
      ? <GroupedActivities>{content()}</GroupedActivities>
      : <div className="chat-inline-tool-content chat-detail-stack">
        {content ? content() : <ChatToolContent item={source} onLoad={onLoad} />}
      </div>)}
  </div>;
}
