import { createRoot } from 'react-dom/client';
import { ConversationSyncPanel } from '../../../shared/conversation/sync/ConversationSyncPanel';
import { ConversationSyncDialog } from '../../../shared/conversation/sync/ConversationSyncDialog';
import { conversationSyncFixture } from '../../../shared/testing/conversationSyncFixture';
import { ApplicationTypography } from '../../../shared/appearance/ApplicationTypography';
import { saveGlobalFontSize } from '../../../shared/appearance/fontSize';
import { setLanguage } from '../../../shared/localization/browserClient';
import { WebLocaleProvider } from '../src/i18n/WebLocaleProvider';
import { setThemeMode } from '../src/theme/preference';
import { SyncDownloadHarness } from '../../../shared/testing/SyncDownloadHarness';
import 'antd/dist/reset.css';
import '../src/styles.css';

const parameters = new URLSearchParams(location.search);
const fixtureParameters = new URLSearchParams(parameters);
fixtureParameters.set('mode', 'web');
fixtureParameters.set('duplicates', '1');
const fixture = conversationSyncFixture(fixtureParameters);
Reflect.set(window, 'syncCalls', fixture.calls);
Reflect.set(window, 'releaseSyncTransfer', fixture.release);
setLanguage('zh');
setThemeMode(parameters.has('dark') ? 'dark' : 'light');
saveGlobalFontSize(Number(parameters.get('font')) || 14);
createRoot(document.getElementById('root')!).render(
  <ApplicationTypography><WebLocaleProvider>
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {parameters.has('managed') ? <SyncDownloadHarness {...fixture} /> : parameters.has('dialog')
        ? <ConversationSyncDialog><ConversationSyncPanel {...fixture} onSynced={() => {}} /></ConversationSyncDialog>
        : <ConversationSyncPanel {...fixture} onSynced={() => {}} />}
    </div>
  </WebLocaleProvider></ApplicationTypography>,
);
