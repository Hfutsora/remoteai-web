import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ChatSettings } from '../../../shared/remote-chat/views/ChatSettings';
import { initialSettings, settingsCardFixture } from '../../../shared/remote-chat/testing/settingsFixture';
import { setInterfaceLanguage } from '../../../shared/localization/interfaceLanguage';
import { t } from '../../../shared/localization/browserClient';
import { initializeTheme } from '../src/theme/preference';
import '../src/styles.css';
import '../../../shared/remote-chat/views/chat.css';

const params = new URLSearchParams(location.search);
initializeTheme();
setInterfaceLanguage(params.get('language') ?? 'zh');
const fixture = {
  ...settingsCardFixture,
  readUsage: async () => ({ ...await settingsCardFixture.readUsage(),
    primaryRemainingPercent: Number(params.get('remaining') ?? 0) }),
  tokenUsage: { ...settingsCardFixture.tokenUsage,
    contextTokens: params.has('context') ? Number(params.get('context')) : undefined },
};

function Harness() {
  const [selection, setSelection] = useState(initialSettings);
  const [open, setOpen] = useState(true);
  return <main style={{ minHeight: '100dvh', padding: 20, background: '#f4f4f4' }}>
    <button onClick={() => setOpen(true)}>{t('client.chat.chatSettings.1e06eb')}</button>
    {open && <ChatSettings {...fixture} selection={selection}
      updateSettings={async patch => setSelection(current => ({ ...current, ...patch }))}
      onClose={() => setOpen(false)} />}
  </main>;
}

createRoot(document.getElementById('root')!).render(<Harness />);
