import { createRoot } from 'react-dom/client';
import { ApplicationTypography } from '../../../shared/appearance/ApplicationTypography';
import { ChatDetailsWorkspace } from '../../../shared/remote-chat/views/ChatDetailsWorkspace';
import { ChatMarkdown } from '../../../shared/remote-chat/views/ChatMarkdown';
import { setLanguage } from '../../../shared/localization/browserLanguage';
import { WebLocaleProvider } from '../src/i18n/WebLocaleProvider';
import { initializeTheme } from '../src/theme/preference';
import 'antd/dist/reset.css';
import '../src/styles.css';
import '../../../shared/remote-chat/views/chat.css';

initializeTheme();
setLanguage('zh');
createRoot(document.getElementById('root')!).render(<ApplicationTypography><WebLocaleProvider>
  <main className="chat-page" style={{ height: '100vh' }}>
    <ChatDetailsWorkspace selected="browser-tabs" active enabled>
      <div className="chat-conversation" style={{ padding: 24 }}>
        <ChatMarkdown text={`[使用指南](${location.origin}/preview-site/guide)`} />
      </div>
    </ChatDetailsWorkspace>
  </main>
</WebLocaleProvider></ApplicationTypography>);
