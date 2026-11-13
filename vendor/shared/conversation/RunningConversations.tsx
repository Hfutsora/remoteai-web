import { useId, useState, type CSSProperties } from 'react';
import { theme, Tooltip } from 'antd';
import { ChevronUp, CircleAlert, ListVideo, LoaderCircle } from 'lucide-react';
import { useCliGui } from '../cli-gui/context';
import { useGuiLanguage } from '../localization/useGuiLanguage';
import { uiText } from '../localization/uiText';
import type { RunningConversation } from './runningConversationEntries';
import styles from './RunningConversations.module.less';

export function RunningConversations({ entries, selected, disabled, onSelect, onOpen }: {
  entries: RunningConversation[];
  selected: string | null;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onOpen: () => void;
}) {
  useGuiLanguage();
  const cli = useCliGui();
  const { token } = theme.useToken();
  const [collapsed, setCollapsed] = useState(false);
  const listId = useId();
  const sessions = new Map((cli?.state.sessions ?? []).map(session => [`cli:${session.engine}:${session.id}`, session]));
  if (cli?.state.selected) {
    const session = cli.state.selected;
    sessions.set(`cli:${session.engine}:${session.id}`, session);
  }
  const items = [...entries, ...[...sessions].filter(([, session]) =>
    session.status === 'running' || session.permissions.length > 0).map(([id, session]) => ({
    id, title: session.title, cwd: session.cwd, needsInput: session.permissions.length > 0,
  }))];
  if (!items.length) return null;
  const current = cli?.state.engine !== 'codex' && cli?.state.selected
    ? `cli:${cli.state.engine}:${cli.state.selected.id}` : selected;
  const style = { fontSize: token.fontSize, lineHeight: token.lineHeight,
    '--running-row-height': '4em' } as CSSProperties;
  const label = uiText('client.chat.inProgress');
  return <aside className={`${styles.panel} ${collapsed ? styles.collapsed : ''}`} style={style}
    aria-label={label} data-running-conversations>
    {collapsed ? <Tooltip title={label} placement="left" styles={{ root: { maxWidth: 400 } }}>
      <button type="button" className={styles.toggle} aria-label={uiText('client.composer.expandConversationList')}
        aria-expanded={false} aria-controls={listId} onClick={() => setCollapsed(false)}>
        <ListVideo aria-hidden size="1.25em" />
      </button>
    </Tooltip> : <>
      <div className={styles.heading}><ListVideo size="1.2em" aria-hidden />
        <strong>{label}</strong><span className={styles.count}>{items.length}</span>
        <button type="button" className={styles.toggle} aria-label={uiText('client.composer.collapseConversationList')}
          aria-expanded aria-controls={listId} onClick={() => setCollapsed(true)}>
          <ChevronUp size="1.2em" aria-hidden />
        </button>
      </div>
      <div id={listId} className={styles.list} data-running-conversations-list>
        {items.map(entry => <RunningConversationRow key={entry.id} entry={entry} selected={current === entry.id}
          disabled={disabled || cli?.state.busy} onSelect={() => {
            const session = sessions.get(entry.id);
            if (session) cli?.controller.open(session);
            else { cli?.controller.showCodex(); onSelect(entry.id); }
            onOpen();
          }} />)}
      </div>
    </>}
  </aside>;
}

function RunningConversationRow({ entry, selected, disabled, onSelect }: {
  entry: RunningConversation; selected: boolean; disabled?: boolean; onSelect: () => void;
}) {
  const title = entry.title || uiText('client.chat.newChat');
  const project = entry.projectName || entry.cwd.split(/[\\/]/).filter(Boolean).at(-1);
  return <Tooltip title={title} placement="left" styles={{ root: { maxWidth: 400 } }}>
    <button type="button" className={styles.row} disabled={disabled} aria-label={title}
      aria-current={selected ? 'page' : undefined} onClick={onSelect}>
      {entry.needsInput ? <CircleAlert size="1.15em" className={styles.attention}
        aria-label={uiText('client.shared.waitingForYourInput')} />
        : <LoaderCircle size="1.15em" className={styles.spinner} aria-label={uiText('client.chat.replying')} />}
      <span className={styles.text}><span className={styles.title}>{title}</span>
        {project && <span className={styles.project}>{project}</span>}
      </span>
    </button>
  </Tooltip>;
}
