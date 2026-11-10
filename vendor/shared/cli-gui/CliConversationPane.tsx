import { useEffect, type ReactNode } from 'react';
import { Alert, Button, Spin } from 'antd';
import { uiText } from '../localization/uiText';
import { useLanguage } from '../localization/browserClient';
import type { DictationClient } from '../chat/dictation/client';
import { useCliGui } from './context';
import { CliMessages } from './CliMessages';
import { CliPermissions } from './CliPermissions';
import { CliComposer } from './CliComposer';
import { cliErrorText } from './errors';
import { useGuiFontSize, guiFontStyle } from '../appearance/fontSize';

export function CliConversationPane({ cwd = '', projectPicker, dictation }: {
  cwd?: string; projectPicker?: ReactNode; dictation?: DictationClient;
}) {
  useLanguage();
  const cli = useCliGui();
  const fontSize = useGuiFontSize();
  useEffect(() => { if (cli && !cli.state.cwd && cwd) cli.controller.patch({ cwd }); }, [cwd, cli?.controller]);
  if (!cli || cli.state.engine === 'codex') return null;
  const { state, controller } = cli;
  const status = state.runtime[state.engine === 'claude' ? 'claude' : 'gemini'];
  const installing = status?.status === 'installing';
  return <section className="cli-gui-pane" style={guiFontStyle(fontSize)} aria-label={uiText('client.cliGui.conversation')}>
    {state.error && <Alert type="error" showIcon message={cliErrorText(state.error)} closable
      onClose={() => controller.patch({ error: '' })} />}
    {status?.status !== 'ready' && <div className="cli-gui-setup">
      <p>{uiText('client.cliGui.setupHint')}</p>
      <Button type="primary" loading={installing} onClick={() => { void controller.install(); }}>
        {uiText(installing ? 'client.cliGui.installing' : 'client.cliGui.install')}</Button>
      {installing && <span role="status"><Spin size="small" /> {uiText('client.cliGui.installing')}</span>}
      {status?.error && <p role="alert">{cliErrorText(status.error)}</p>}
    </div>}
    <CliMessages history={state.history} loading={state.loading} loadOlder={controller.loadOlder} />
    {state.selected && <CliPermissions session={state.selected} busy={state.busy} respond={controller.act} />}
    <CliComposer projectPicker={projectPicker} dictation={dictation} />
  </section>;
}
