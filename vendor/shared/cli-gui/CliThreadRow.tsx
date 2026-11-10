import { uiText } from '../localization/uiText';
import { ThreadStatus } from '../conversation/ThreadStatus';
import styles from '../conversation/styles.module.less';
import { useCliGui } from './context';
import type { CliSession } from './types';

export function CliThreadRow({ session, onSelect, web = false }: {
  session: CliSession; onSelect: () => void; web?: boolean;
}) {
  const cli = useCliGui();
  if (!cli) return null;
  const selected = cli.state.selected?.id === session.id && cli.state.engine === session.engine;
  const title = session.title || uiText('client.workspaceSettings.newConversation');
  return <div data-cli-thread={session.id}
    className={web ? 'chat-thread-row' : `${styles.thread} ${selected ? styles.selected : ''}`}>
    <button type="button" className={web ? 'chat-thread' : styles.threadSelect} disabled={cli.state.busy}
      aria-label={title} aria-current={selected ? 'page' : undefined}
      onClick={() => { cli.controller.open(session); onSelect(); }}>
      <span className={web ? 'chat-grow chat-ellipsis' : styles.threadTitle}>{title}</span>
      <ThreadStatus running={session.status === 'running'} needsInput={session.permissions.length > 0} unread={false} />
    </button>
  </div>;
}
