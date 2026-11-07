import { useState, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import { ConfigProvider, theme } from 'antd';
import { ApplicationTypography } from '../../../shared/appearance/ApplicationTypography';
import { saveGlobalFontSize } from '../../../shared/appearance/fontSize';
import { createMobileProjectPickerFixture } from '../../../shared/testing/mobileProjectPickerFixture';
import { ChatProjectSwitch } from '../../../shared/remote-chat/views/ChatProjectSwitch';
import { setLanguage } from '../../../shared/localization/browserClient';
import type { AppLanguage } from '@remoteai/i18n';
import { setThemeMode } from '../src/theme/preference';
import 'antd/dist/reset.css';
import '../src/styles.css';
import '../../../shared/remote-chat/views/chat.css';

const params = new URLSearchParams(location.search);
const dark = params.has('dark');
setThemeMode(dark ? 'dark' : 'light');
setLanguage((params.get('language') ?? 'zh') as AppLanguage<'native'>);
saveGlobalFontSize(Number(params.get('font') ?? 14));
const { controller, fixture } = createMobileProjectPickerFixture();
Object.assign(window, { projectPickerFixture: fixture });

function Harness() {
  const state = useSyncExternalStore(controller.subscribe, controller.snapshot);
  const [draft, setDraft] = useState('保留这条尚未发送的消息');
  return <ApplicationTypography><ConfigProvider theme={{ algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: { motion: false } }}><main style={{ minHeight: '100dvh', display: 'flex', justifyContent: 'end',
      flexDirection: 'column', padding: 16, background: 'var(--app-canvas)', color: 'var(--app-ink)' }}>
    <ChatProjectSwitch state={state} controller={controller} active />
    <textarea aria-label="聊天消息" value={draft} onChange={event => setDraft(event.target.value)} />
    <output hidden data-testid="chosen-project">{state.draftProject?.cwd ?? ''}</output>
  </main></ConfigProvider></ApplicationTypography>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
