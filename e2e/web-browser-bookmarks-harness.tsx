import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { BrowserPage } from '../../../shared/browser/BrowserPage';
import { BookmarkProvider } from '../../../shared/browser/bookmarks/context';
import { ApplicationTypography } from '../../../shared/appearance/ApplicationTypography';
import { WebsitePreview } from '../../../shared/file-preview/workspace/WebsitePreview';
import { useWebsiteTabs } from '../../../shared/file-preview/workspace/useWebsiteTabs';
import { WebLocaleProvider } from '../src/i18n/WebLocaleProvider';
import { initializeTheme } from '../src/theme/preference';
import { setLanguage } from '../../../shared/localization/browserLanguage';
import 'antd/dist/reset.css';
import '../src/styles.css';
import '../../../shared/remote-chat/views/chat.css';
import '../../../shared/remote-chat/views/detailsWorkspace.css';

const params = new URLSearchParams(location.search);
localStorage.setItem('codex-switch:global-font-size', params.get('font') ?? '14');
localStorage.setItem('codex-switch.web.theme.v1', params.has('dark') ? 'dark' : 'light');
initializeTheme(); setLanguage('zh');

function Sidebar() {
  const browser = useWebsiteTabs();
  const [expanded, setExpanded] = useState(false);
  useEffect(() => { browser.onNewTab(); }, [browser.onNewTab]);
  return <WebsitePreview browser={browser} active resizing={false} expanded={expanded}
    toggleExpanded={() => setExpanded(value => !value)} onClose={() => {}} />;
}

createRoot(document.getElementById('root')!).render(<ApplicationTypography><WebLocaleProvider>
  <BookmarkProvider scope="web-bookmarks">
    <main className="chat-page" style={{ display: 'flex', height: '100vh' }}>
      {params.has('sidebar') ? <><section style={{ flex: 1, padding: 24 }}>Remote AI</section>
        <aside className="chat-diff-workspace" style={{ width: '65%', flex: '0 0 65%', display: 'flex' }}>
          <Sidebar /></aside></> : <BrowserPage language="zh" />}
    </main>
  </BookmarkProvider>
</WebLocaleProvider></ApplicationTypography>);
