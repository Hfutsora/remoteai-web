import { useEffect, type ReactNode } from 'react';
import { Alert } from 'antd';
import { uiText } from '../localization/uiText';
import { useLanguage } from '../localization/browserClient';
import type { DictationClient } from '../chat/dictation/client';
import { useCliGui } from './context';
import { CliMessages, type CliMessagesProps } from './CliMessages';
import { CliPermissions } from './CliPermissions';
import { CliComposer, type CliModelSource } from './CliComposer';
import { CliInstaller } from './CliInstaller';
import { cliErrorText } from './errors';
import { useGuiFontSize, guiFontStyle } from '../appearance/fontSize';

export function CliConversationPane({ cwd = '', projectPicker, dictation, modelSource, active = true,
  renderMessages = props => <CliMessages {...props} />, scrollableComposer }: {
  cwd?: string; projectPicker?: ReactNode; dictation?: DictationClient;
  modelSource: CliModelSource; active?: boolean; scrollableComposer?: boolean;
  renderMessages?: (props: CliMessagesProps) => ReactNode;
}) {
  useLanguage();
  const cli = useCliGui();
  const fontSize = useGuiFontSize();
  useEffect(() => { if (cli && !cli.state.cwd && cwd) cli.controller.patch({ cwd }); }, [cwd, cli?.controller]);
  if (!cli || cli.state.engine === 'codex') return null;
  const { state, controller } = cli;
  const status = state.runtime[state.engine === 'claude' ? 'claude' : 'gemini'];
  const footer = <>
    {state.selected && <CliPermissions session={state.selected} busy={state.busy} respond={controller.act} />}
    <CliComposer projectPicker={projectPicker} dictation={dictation} modelSource={modelSource} />
  </>;
  return <section className="cli-gui-pane" style={guiFontStyle(fontSize)} aria-label={uiText('client.cliGui.conversation')}>
    {state.error && <Alert type="error" showIcon message={cliErrorText(state.error)} closable
      onClose={() => controller.patch({ error: '' })} />}
    {status?.status !== 'ready' ? <CliInstaller /> : renderMessages({ history: state.history,
      selected: state.selected?.id ?? null, loading: state.loading, loadOlder: controller.loadOlder,
      footer, active, scrollableComposer })}
  </section>;
}
