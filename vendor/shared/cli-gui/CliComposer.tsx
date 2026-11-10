import { useEffect, useState, type ReactNode } from 'react';
import { Button, Dropdown, Input, Tooltip } from 'antd';
import { ArrowUp, Archive, ChevronDown, RefreshCw, ShieldCheck, Square } from 'lucide-react';
import { uiText } from '../localization/uiText';
import { ModelPicker } from '../conversation/ModelPicker';
import type { Model } from '../conversation/types';
import { resolveModelSelection } from '../conversation/modelSelection';
import { ComposerContextMenu } from '../chat/ComposerContextMenu';
import { ComposerDictation } from '../chat/dictation/ComposerDictation';
import type { DictationClient } from '../chat/dictation/client';
import { useGuiFontSize, guiFontStyle } from '../appearance/fontSize';
import { useCliGui } from './context';
import { EngineSelector } from './EngineSelector';
import { CliInstallLink } from './CliInstallLink';
import styles from '../conversation/styles.module.less';
import '../remote-chat/views/composer.css';
import '../remote-chat/views/composerDesktop.css';
import '../remote-chat/views/composerFooter.css';

export interface CliModelSource {
  models: Model[]; loading?: boolean; error?: string; refresh: () => Promise<void>;
}

export function CliComposer({ projectPicker, dictation, modelSource, remoteLayout = false }: {
  projectPicker?: ReactNode; dictation?: DictationClient; modelSource: CliModelSource; remoteLayout?: boolean;
}) {
  const { state, controller } = useCliGui()!;
  const { engine, selected, catalog, busy } = state;
  const [dictating, setDictating] = useState(false);
  const fontSize = useGuiFontSize();
  const { models, loading, error, refresh } = modelSource;
  useEffect(() => {
    const selection = resolveModelSelection(models, { model: state.model, effort: state.effort });
    if (selection.model !== state.model || selection.effort !== state.effort) controller.patch(selection);
  }, [models, state.model, state.effort, controller]);
  if (engine === 'codex') return null;
  const running = selected?.status === 'running';
  const ready = state.runtime[engine]?.status === 'ready';
  const disabled = busy || dictating || selected?.archived;
  const canSend = ready && !disabled && !running && !selected?.permissions.length && !loading
    && models.some(model => model.model === state.model)
    && Boolean(state.draft.trim()) && (Boolean(selected) || Boolean(state.cwd));
  const refreshCatalog = async () => {
    try { await refresh(); await controller.refresh(); await controller.loadCatalog(); }
    catch (reason) { controller.report(reason); }
  };
  return <div className={styles.composerWrap} style={guiFontStyle(fontSize)}>
    {projectPicker ?? <div className={styles.projectBar}><Input value={selected?.cwd ?? state.cwd}
      disabled={Boolean(selected) || busy} aria-label={uiText('client.cliGui.folder')}
      placeholder={uiText('client.cliGui.folderHint')}
      onChange={event => controller.patch({ cwd: event.target.value })} /></div>}
    <div className={styles.composer}>
      <ComposerContextMenu scope={`${engine}:${selected?.id ?? 'draft'}`} active translate={uiText}>
        <Input.TextArea value={state.draft} autoSize={{ minRows: 3, maxRows: 8 }}
          aria-label={uiText('client.cliGui.message')} placeholder={uiText('client.cliGui.messageHint')}
          disabled={disabled} onChange={event => controller.edit(event.target.value)}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && canSend) {
              event.preventDefault(); void controller.send();
            }
          }} />
      </ComposerContextMenu>
      <div className={styles.composerControls}>
        {!!catalog?.modes.length && <Dropdown trigger={['click']} placement="topLeft"
          menu={{ selectedKeys: [state.mode], items: catalog.modes.map(mode => ({ key: mode.id, label: mode.label })),
            onClick: ({ key }) => controller.patch({ mode: key }) }} disabled={Boolean(selected) || busy}>
          <Button type="text" size="small" icon={<ShieldCheck size={16} />}>
            {catalog.modes.find(mode => mode.id === state.mode)?.label}<ChevronDown size={12} />
          </Button>
        </Dropdown>}
        <div className={styles.modelControls}>
          {selected && !selected.archived && <Tooltip title={uiText('client.cliGui.archive')} styles={{ root: { maxWidth: 400 } }}>
            <Button type="text" size="small" icon={<Archive size={15} />} disabled={busy || running}
              aria-label={uiText('client.cliGui.archive')} onClick={() => { void controller.act({
                engine, action: 'archive', id: selected.id,
              }); }} /></Tooltip>}
          <Button type="text" size="small" icon={<RefreshCw size={14} />} disabled={busy}
            aria-label={uiText('client.cliGui.refresh')} onClick={() => { void refreshCatalog(); }} />
          <ModelPicker models={models} model={state.model} effort={state.effort}
            error={error} disabled={!ready || busy || Boolean(running) || Boolean(loading)} onRetry={refreshCatalog}
            onChange={selection => controller.patch(selection)} />
          {dictation && <ComposerDictation client={dictation} active={ready} disabled={Boolean(disabled)}
            onBusyChange={setDictating} onText={text => controller.edit(`${state.draft}${text}`)} />}
          <Button type="primary" shape="circle" icon={running ? <Square size={16} fill="currentColor" /> : <ArrowUp size={18} />}
            loading={busy} disabled={running ? busy : !canSend}
            aria-label={uiText(running ? 'client.cliGui.stop' : 'client.cliGui.send')}
            onClick={() => { void (running && selected ? controller.act({ engine, action: 'stop', id: selected.id })
              : controller.send()); }} />
        </div>
      </div>
    </div>
    <div className={remoteLayout ? 'chat-composer-hint' : styles.composerHint}>
      <EngineSelector /><CliInstallLink engine={engine} />
    </div>
  </div>;
}
