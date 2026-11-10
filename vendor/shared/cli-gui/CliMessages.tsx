import { useMemo } from 'react';
import { ChatMessages } from '../remote-chat/views/ChatMessages';
import { cliThread } from './presentation';
import type { CliHistory } from './types';

export function CliMessages({ history, loading, loadOlder }: {
  history: CliHistory | null; loading: boolean; loadOlder: () => Promise<void>;
}) {
  const thread = useMemo(() => cliThread(history), [history]);
  return <ChatMessages thread={thread} loading={loading} loadingMore={loading && Boolean(history)}
    hasMore={history?.hasOlder} loadOlder={loadOlder} />;
}
