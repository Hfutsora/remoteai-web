import { useState, type ReactNode } from 'react';
import { Button, Dropdown, Input, Tooltip } from 'antd';
import { ArrowUp, Archive, ChevronDown, RefreshCw, ShieldCheck, Square } from 'lucide-react';
import { uiText } from '../localization/uiText';
import { ModelPicker } from '../conversation/ModelPicker';
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

export function CliComposer({ projectPicker, dictation }: { projectPicker?: ReactNode; dictation?: DictationClient }) {
  const { state, controller } = useCliGui()!;
  const { engine, selected, catalog, busy } = state;
  const [dictating, setDictating] = useState(false);
  const fontSize = useGuiFontSize();
  if (engine === 'codex') return null;
  const running = selected?.status === 'running';
  const ready = state.runtime[engine]?.status === 'ready';
  const disabled = busy || dictating || selected?.archived;
  const canSend = ready && !disabled && !running && !selected?.permissions.length && !!state.model
    && Boolean(state.draft.trim()) && (Boolean(selected) || Boolean(state.cwd));
  const models = (catalog?.models ?? []).map(model => ({ id: model.id, model: model.id,
    displayName: model.label, isDefault: !!model.isDefault, defaultReasoningEffort: model.defaultEffort ?? '',
    supportedReasoningEfforts: model.efforts?.map(effort => ({ reasoningEffort: effort.id, description: effort.label })) ?? [] }));
  return <div className={styles.composerWrap} style={guiFontStyle(fontSize)}>
    {projectPicker ?? <div className={styles.projectBar}><Input value={selected?.cwd ?? state.cwd}
      disabled={Boolean(selected) || busy} aria-label={uiText('client.cliGui.folder')}
      placeholder={uiText('client.cliGui.folderHint')}
      onChange={event => controller.patch({ cwd: event.target.value })} /></div>}
    <div className={styles.composer}>
      <ComposerContextMenu scope={`${engine}:${selected?.id ?? 'draft'}`} active translate={uiText}>
        <Input.TextArea value={state.draft} autoSize={{ minRows: 2, maxRows: 8 }}
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
            aria-label={uiText('client.cliGui.refresh')} onClick={() => { void controller.refresh().then(controller.loadCatalog); }} />
          <ModelPicker models={models} model={state.model} effort={state.effort}
            disabled={!ready || busy || Boolean(running)} onRetry={controller.loadCatalog}
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
    <div className={styles.composerHint}><EngineSelector /><CliInstallLink engine={engine} /></div>
  </div>;
}
