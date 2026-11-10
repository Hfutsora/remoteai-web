import { LoaderCircle, MessageSquare } from 'lucide-react';
import { useEffect } from 'react';
import { useCliGui } from './context';
import { engineNames } from './EngineSelector';
import { uiText } from '../localization/uiText';
import styles from '../conversation/styles.module.less';

export function CliConversationList({ onSelect, archived = false, query = '' }: {
  onSelect?: () => void; archived?: boolean; query?: string;
}) {
  const cli = useCliGui();
  useEffect(() => { cli?.controller.filter(archived); }, [archived, cli?.controller]);
  const sessions = cli?.state.sessions.filter(session => session.archived === archived
    && `${session.title} ${session.cwd}`.toLowerCase().includes(query.trim().toLowerCase())) ?? [];
  if (!cli || !sessions.length) return null;
  return <section className="cli-gui-thread-list" aria-label={uiText('client.cliGui.conversations')}>
    {sessions.map(session => <div key={session.id} data-selected={cli.state.selected?.id === session.id}
      className={`${styles.thread} ${cli.state.selected?.id === session.id ? styles.selected : ''}`}>
      <button type="button" className={styles.threadSelect} disabled={cli.state.busy}
        aria-current={cli.state.selected?.id === session.id ? 'page' : undefined}
        onClick={() => { cli.controller.open(session); onSelect?.(); }}>
        <span className="cli-gui-thread-copy"><span className={styles.threadTitle}>
          {session.title || uiText('client.workspaceSettings.newConversation')}</span>
          <small>{uiText(engineNames[session.engine])}</small></span>
        {session.status === 'running' ? <LoaderCircle size={14} className="chat-spinner" /> : <MessageSquare size={13} />}
      </button>
    </div>)}
  </section>;
}
