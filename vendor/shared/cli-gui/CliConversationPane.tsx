import { useEffect } from 'react';
import { Alert, Button, Input, Select, Spin } from 'antd';
import { Archive, ArrowUp, RefreshCw, Square } from 'lucide-react';
import { uiText } from '../localization/uiText';
import { useLanguage } from '../localization/browserClient';
import { useCliGui } from './context';
import { CliMessages } from './CliMessages';
import { CliPermissions } from './CliPermissions';
import { EngineSelector } from './EngineSelector';
import { cliErrorText } from './errors';
import { CliInstallLink } from './CliInstallLink';

export function CliConversationPane({ cwd = '' }: { cwd?: string }) {
  useLanguage();
  const cli = useCliGui();
  useEffect(() => { if (cli && !cli.state.cwd && cwd) cli.controller.patch({ cwd }); }, [cwd, cli?.controller]);
  if (!cli || cli.state.engine === 'codex') return null;
  const { state, controller } = cli;
  const { engine, selected, runtime, catalog, busy } = state;
  if (engine === 'codex') return null;
  const status = runtime[engine];
  const running = selected?.status === 'running';
  const ready = status?.status === 'ready';
  const canSend = ready && !busy && !running && !selected?.archived && !selected?.permissions.length && Boolean(state.draft.trim())
    && (Boolean(selected) || Boolean(state.cwd && state.model));
  const retry = () => { void controller.refresh().then(controller.loadCatalog); };
  return <section className="cli-gui-pane" aria-label={uiText('client.cliGui.conversation')}>
    {state.error && <Alert type="error" showIcon message={cliErrorText(state.error)} closable
      onClose={() => controller.patch({ error: '' })} />}
    {!ready && <div className="cli-gui-setup">
      <p>{uiText('client.cliGui.setupHint')}</p>
      {status?.status === 'installing' ? <span role="status"><Spin size="small" /> {uiText('client.cliGui.installing')}</span>
        : <Button onClick={() => { void controller.install(); }}>{uiText('client.cliGui.install')}</Button>}
      {status?.error && <p role="alert">{cliErrorText(status.error)}</p>}
    </div>}
    <CliMessages history={state.history} loading={state.loading} loadOlder={controller.loadOlder} />
    {selected && <CliPermissions session={selected} busy={busy} respond={controller.act} />}
    <div className="cli-gui-composer">
      <div className="cli-gui-composer-options">
        <Input value={selected?.cwd ?? state.cwd} disabled={Boolean(selected) || busy}
          aria-label={uiText('client.cliGui.folder')} placeholder={uiText('client.cliGui.folderHint')}
          onChange={event => controller.patch({ cwd: event.target.value })} onBlur={() => { void controller.loadCatalog(); }} />
        {selected && !selected.archived && <Button type="text" icon={<Archive size={15} />} disabled={busy || running}
          aria-label={uiText('client.cliGui.archive')} onClick={() => { void controller.act({
            engine, action: 'archive', id: selected.id,
          }); }} />}
      </div>
      {!selected && ready && catalog?.status !== 'ready' && <p className="cli-gui-help">
        {uiText('client.cliGui.signInHint', { cli: engine === 'claude' ? 'Claude Code' : 'Gemini CLI' })}
      </p>}
      <Input.TextArea value={state.draft} autoSize={{ minRows: 2, maxRows: 8 }}
        aria-label={uiText('client.cliGui.message')} placeholder={uiText('client.cliGui.messageHint')}
        disabled={busy || selected?.archived} onChange={event => controller.edit(event.target.value)}
        onKeyDown={event => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && canSend) {
            event.preventDefault(); void controller.send();
          }
        }} />
      <div className="cli-gui-composer-options">
        <Select value={selected?.model ?? (state.model || undefined)} disabled={Boolean(selected) || busy}
          aria-label={uiText('client.cliGui.model')} placeholder={uiText('client.cliGui.model')}
          options={selected ? [{ value: selected.model, label: selected.model }]
            : catalog?.models.map(model => ({ value: model.id, label: model.label }))}
          onChange={model => controller.patch({ model })} />
        {!selected && !!catalog?.modes.length && <Select value={state.mode || undefined}
          aria-label={uiText('client.cliGui.mode')} disabled={busy} placeholder={uiText('client.cliGui.mode')}
          options={catalog.modes.map(mode => ({ value: mode.id, label: mode.label }))}
          onChange={mode => controller.patch({ mode })} />}
        <Button type="text" icon={<RefreshCw size={15} />} onClick={retry} disabled={busy}
          aria-label={uiText('client.cliGui.refresh')} />
        <div className="cli-gui-spacer" />
        {running && selected ? <Button icon={<Square size={15} />} disabled={busy}
          onClick={() => { void controller.act({ engine, action: 'stop', id: selected.id }); }}>
          {uiText('client.cliGui.stop')}</Button>
          : <Button type="primary" shape="circle" icon={<ArrowUp size={18} />} loading={busy} disabled={!canSend}
            aria-label={uiText('client.cliGui.send')} onClick={() => { void controller.send(); }} />}
      </div>
    </div>
    <footer className="cli-gui-footer"><EngineSelector /><CliInstallLink engine={engine} /></footer>
  </section>;
}
