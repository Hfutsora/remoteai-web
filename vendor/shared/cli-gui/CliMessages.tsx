import { useEffect, useRef } from 'react';
import { Button, Empty, Spin } from 'antd';
import Markdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { uiText } from '../localization/uiText';
import type { CliEntry, CliHistory } from './types';
import styles from '../conversation/styles.module.less';
import { useGuiFontSize, guiFontStyle } from '../appearance/fontSize';

function Message({ entry }: { entry: CliEntry }) {
  if (!entry.text && !entry.title) return null;
  if (entry.role === 'tool' || entry.role === 'reasoning') return <details className="cli-gui-tool">
    <summary>{entry.title || uiText('client.cliGui.reasoning')}
      {entry.status === 'running' && <Spin size="small" />}</summary><pre>{entry.text}</pre>
  </details>;
  return <article className={`cli-gui-message cli-gui-${entry.role}`}>
    <div className={styles.markdown}><Markdown remarkPlugins={[remarkGfm]} skipHtml
      urlTransform={(url, key) => key === 'href' && /^https?:\/\//i.test(url) ? defaultUrlTransform(url) : ''}>
      {entry.text}
    </Markdown></div>
  </article>;
}

export function CliMessages({ history, loading, loadOlder }: {
  history: CliHistory | null; loading: boolean; loadOlder: () => Promise<void>;
}) {
  const region = useRef<HTMLDivElement>(null);
  const fontSize = useGuiFontSize();
  const pinned = useRef(true);
  const lastId = useRef<string>();
  useEffect(() => {
    if (lastId.current !== history?.session.id) pinned.current = true;
    lastId.current = history?.session.id;
    if (pinned.current && region.current) region.current.scrollTop = region.current.scrollHeight;
  }, [history]);
  return <div className="cli-gui-messages" style={guiFontStyle(fontSize)} ref={region} role="log"
    aria-live="polite" aria-busy={loading}
    onScroll={event => { const node = event.currentTarget;
      pinned.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80; }}>
    {history?.hasOlder && <Button type="text" loading={loading} onClick={() => { void loadOlder(); }}>
      {uiText('client.cliGui.older')}</Button>}
    {!history && (loading ? <Spin /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={uiText('client.cliGui.startHint')} />)}
    {history?.entries.map(entry => <Message key={entry.id} entry={entry} />)}
  </div>;
}
