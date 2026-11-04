import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatMessages } from '../../../shared/remote-chat/views/ChatMessages';
import { ChatSidebar } from '../../../shared/remote-chat/views/ChatSidebar';
import { ChatProcessing } from '../../../shared/remote-chat/views/ChatProcessing';
import { ChatQuotesProvider } from '../../../shared/remote-chat/views/ChatQuotes';
import { ChatDetailsWorkspace } from '../../../shared/remote-chat/views/ChatDetailsWorkspace';
import { ConversationChangesButton } from '../../../shared/conversation/ConversationChangesButton';
import { useDesktopLayout } from '../../../shared/layout/useDesktopLayout';
import type { Thread } from '../../../shared/remote-chat/views/types';
import { mergeHistory } from '../../../shared/remote-chat/client/history';
import { historyLoadResult, type HistoryLoadResult } from '../../../shared/remote-chat/client/historyLoad';
import { currentRunningTurn } from '../../../shared/chat/runningTurn';
import '../src/styles.css';
import '../../../shared/remote-chat/views/chat.css';

function Harness() {
  const desktop = useDesktopLayout();
  const sidebarFixture = new URLSearchParams(location.search).has('sidebar');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [thread, setThread] = useState<Thread | null>(null);
  const [hasMore, setHasMore] = useState(new URLSearchParams(location.search).has('history'));
  const [loadingMore, setLoadingMore] = useState(false);
  const [historyLoad, setHistoryLoad] = useState<HistoryLoadResult>();
  const runningTurn = currentRunningTurn(thread?.turns);
  const loadOlder = async () => {
    const startedAt = Date.now();
    setHistoryLoad(undefined);
    setLoadingMore(true);
    try {
      const response = await fetch('/web/display-history.json');
      const page: { turns: NonNullable<Thread['turns']>; hasMore: boolean } = await response.json();
      const loaded = thread && { ...thread, turns: [...page.turns, ...(thread.turns ?? [])] };
      setThread(loaded);
      if (thread && loaded) setHistoryLoad(historyLoadResult(thread, loaded, startedAt));
      setHasMore(page.hasMore);
    } finally { setLoadingMore(false); }
  };
  useEffect(() => {
    void fetch('/web/display-fixture.json').then(response => response.json()).then(setThread);
  }, []);
  useEffect(() => {
    const update = (event: Event) => setThread((event as CustomEvent<Thread>).detail);
    const sync = (event: Event) => setThread(current => current
      ? mergeHistory((event as CustomEvent<Thread>).detail, current, current) : current);
    window.addEventListener('display-fixture', update);
    window.addEventListener('display-history-snapshot', sync);
    return () => {
      window.removeEventListener('display-fixture', update);
      window.removeEventListener('display-history-snapshot', sync);
    };
  }, []);
  return <ChatQuotesProvider scope={thread?.id ?? null} enabled sending={false}>
    <main className="chat-page" style={{ height: '100vh' }}>
      <ChatDetailsWorkspace selected={thread?.id ?? null} active enabled={desktop}>
      <div className="chat-conversation">
        <header className="chat-header"><h2>对话展示回归</h2>
          {sidebarFixture && <button onClick={() => setSidebarOpen(!sidebarOpen)}>打开聊天列表</button>}
          {desktop && <ConversationChangesButton value={thread?.turns ? { turns: thread.turns } : undefined} />}
        </header>
        <ChatMessages key={thread?.id} thread={thread} hasMore={hasMore}
          loadingMore={loadingMore} loadOlder={loadOlder} historyLoad={historyLoad}
          processing={runningTurn && <ChatProcessing key={runningTurn.id} turn={runningTurn} active />} />
        <footer style={{ padding: 20 }}><input aria-label="消息" placeholder="输入消息…" /></footer>
      </div>
      {sidebarFixture && <ChatSidebar desktop={desktop} open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <p>Conversation list</p>
      </ChatSidebar>}
      </ChatDetailsWorkspace>
    </main>
  </ChatQuotesProvider>;
}

createRoot(document.getElementById('root')!).render(<Harness />);
