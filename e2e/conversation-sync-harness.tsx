import { createRoot } from 'react-dom/client';
import { ConversationSyncPanel } from '../../../shared/conversation/sync/ConversationSyncPanel';
import { conversationSyncFixture } from '../../../shared/testing/conversationSyncFixture';
import { ApplicationTypography } from '../../../shared/appearance/ApplicationTypography';
import { saveGlobalFontSize } from '../../../shared/appearance/fontSize';
import { setLanguage } from '../../../shared/localization/browserClient';
import { WebLocaleProvider } from '../src/i18n/WebLocaleProvider';
import { setThemeMode } from '../src/theme/preference';
import 'antd/dist/reset.css';
import '../src/styles.css';

const parameters = new URLSearchParams(location.search);
const fixture = conversationSyncFixture(new URLSearchParams({ mode: 'web', path: parameters.get('path') ?? 'relay',
  duplicates: '1', ...(parameters.has('hold') ? { hold: '1' } : {}) }));
Reflect.set(window, 'syncCalls', fixture.calls);
Reflect.set(window, 'releaseSyncTransfer', fixture.release);
setLanguage('zh');
setThemeMode(parameters.has('dark') ? 'dark' : 'light');
saveGlobalFontSize(Number(parameters.get('font')) || 14);
createRoot(document.getElementById('root')!).render(
  <ApplicationTypography><WebLocaleProvider>
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ConversationSyncPanel {...fixture} onSynced={() => {}} />
    </div>
  </WebLocaleProvider></ApplicationTypography>,
);
