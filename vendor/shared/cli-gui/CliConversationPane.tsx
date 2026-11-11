import { useEffect, type ReactNode } from 'react';
import { Alert } from 'antd';
import { uiText } from '../localization/uiText';
import { useLanguage } from '../localization/browserClient';
import type { DictationClient } from '../chat/dictation/client';
import { useCliGui } from './context';
import { CliMessages, type CliMessagesProps } from './CliMessages';
import { CliPermissions } from './CliPermissions';
import { CliComposer, type CliComposerProps, type CliModelSource } from './CliComposer';
import { CliInstaller } from './CliInstaller';
import { cliErrorText } from './errors';
import { useGuiFontSize, guiFontStyle } from '../appearance/fontSize';
import styles from '../conversation/styles.module.less';

function InstallationConversation({ footer }: { footer: ReactNode }) {
  return <div className={styles.messageArea}>
    <div className={styles.messageViewport}>
      <div className={styles.messageScrollBody}>
        <div className="cli-gui-install-region"><CliInstaller /></div>
        <div className={styles.messageFooter}>{footer}</div>
      </div>
    </div>
  </div>;
}

export function CliConversationPane({ cwd = '', projectPicker, dictation, modelSource, active = true,
  renderMessages = props => <CliMessages {...props} />, scrollableComposer, remoteLayout = false,
  composerHeader, connectionInfo, renderComposer = props => <CliComposer {...props} /> }: {
  cwd?: string; projectPicker?: ReactNode; dictation?: DictationClient;
  modelSource: CliModelSource; active?: boolean; scrollableComposer?: boolean; remoteLayout?: boolean;
  composerHeader?: ReactNode; connectionInfo?: ReactNode;
  renderComposer?: (props: CliComposerProps) => ReactNode;
  renderMessages?: (props: CliMessagesProps) => ReactNode;
}) {
  useLanguage();
  const cli = useCliGui();
  const fontSize = useGuiFontSize();
  useEffect(() => { if (cli && !cli.state.cwd && cwd) cli.controller.patch({ cwd }); }, [cwd, cli?.controller]);
  if (!cli || cli.state.engine === 'codex') return null;
  const { state, controller } = cli;
  const status = state.runtime[state.engine === 'claude' ? 'claude' : 'gemini'];
  const ready = status?.status === 'ready';
  const footer = <>
    {state.selected && <CliPermissions session={state.selected} busy={state.busy || !ready}
      respond={controller.act} remoteLayout={remoteLayout} />}
    {renderComposer({ projectPicker, dictation, modelSource, remoteLayout, active, composerHeader, connectionInfo })}
  </>;
  return <section className="cli-gui-pane" style={guiFontStyle(fontSize)} aria-label={uiText('client.cliGui.conversation')}>
    {state.error && <Alert type="error" showIcon message={cliErrorText(state.error)} closable
      onClose={() => controller.patch({ error: '' })} />}
    {!ready ? <InstallationConversation footer={footer} /> : renderMessages({ history: state.history,
      selected: state.selected?.id ?? null, loading: state.loading, loadOlder: controller.loadOlder,
      footer, active, scrollableComposer })}
  </section>;
}
