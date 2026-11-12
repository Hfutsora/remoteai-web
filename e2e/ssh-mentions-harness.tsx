import { createRoot } from 'react-dom/client';
import { RemoteSshComposerFixture } from '../../../shared/testing/sshComposerFixture';
import { saveGlobalFontSize } from '../../../shared/appearance/fontSize';
import { ApplicationTypography } from '../../../shared/appearance/ApplicationTypography';
import { setGuiLanguage } from '../../../shared/localization/uiText';
import { isLanguage } from '../../../shared/localization/language';
import { WebLocaleProvider } from '../src/i18n/WebLocaleProvider';
import { setThemeMode } from '../src/theme/preference';
import '../src/styles.css';
import 'antd-mobile/es/global';

const params = new URLSearchParams(location.search);
const language = params.get('lang');
setGuiLanguage(isLanguage(language) ? language : 'zh');
setThemeMode(params.has('dark') ? 'dark' : 'light');
saveGlobalFontSize(params.has('large') ? 20 : 14);
createRoot(document.getElementById('root')!).render(<ApplicationTypography><WebLocaleProvider>
  <main className="chat-page" style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
    <header style={{ padding: 28 }}>Remote AI Web · SSH</header>
    <section style={{ width: 'min(800px, calc(100% - 48px))', margin: 'auto auto 32px' }}>
      <RemoteSshComposerFixture />
    </section>
  </main>
</WebLocaleProvider></ApplicationTypography>);
