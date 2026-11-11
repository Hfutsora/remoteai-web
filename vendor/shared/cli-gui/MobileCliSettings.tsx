import { useEffect, useState } from 'react';
import { ChatSettingsSheet } from '../remote-chat/views/ChatSettingsSheet';
import { t, useLanguage } from '../localization/browserClient';
import { ChatProfileMenu, type ChatConnectionProps } from '../remote-chat/views/ChatProfileMenu';
import { ModelRefreshButton } from '../remote-chat/views/ModelRefreshButton';
import { resolveModelSelection } from '../conversation/modelSelection';
import { useCliGui } from './context';
import { cliPickerModels } from './modelSelection';
import { cliModeLabel } from './modeLabels';
import { MobileEngineSelector } from './MobileEngineSelector';

function Choices({ label, value, options, disabled, choose }: {
  label: string; value: string; options: { id: string; label: string }[];
  disabled: boolean; choose: (value: string) => void;
}) {
  return <section className="chat-detail-stack" role="radiogroup" aria-label={label}>
    <strong>{label}</strong>
    {options.map(option => <button key={option.id} type="button" role="radio" className="chat-setting-option"
      aria-checked={value === option.id} disabled={disabled} onClick={() => choose(option.id)}>
      {option.label}
    </button>)}
  </section>;
}

function Settings({ connection, connected, active, close }: {
  connection?: ChatConnectionProps; connected: boolean; active: boolean; close: () => void;
}) {
  const { state, controller } = useCliGui()!;
  const { engine, selected, busy, catalog } = state;
  if (engine === 'codex') return null;
  const model = catalog?.models.find(entry => entry.id === state.model);
  const disabled = !connected || busy || selected?.status === 'running' || Boolean(selected?.archived);
  return <ChatSettingsSheet onClose={close} titleAction={<ModelRefreshButton ready={connected && !busy}
      refreshModels={async () => { await controller.refresh(); await controller.loadCatalog(); }} />}>
    <div className="chat-settings chat-settings-mobile">
      {connection ? <ChatProfileMenu {...connection} variant="settings" compact ready={connected} active={active} />
        : <div className="chat-settings-connection"><MobileEngineSelector ready={connected} active={active} /></div>}
      <Choices label={t('client.shared.model')} value={state.model} options={catalog?.models ?? []}
        disabled={disabled} choose={value => controller.patch(resolveModelSelection(
          cliPickerModels(catalog?.models ?? []), { model: value, effort: '' }))} />
      {!!model?.efforts?.length && <Choices label={t('client.shared.reasoningEffort')} value={state.effort}
        options={model.efforts} disabled={disabled} choose={effort => controller.patch({ effort })} />}
      {!!catalog?.modes.length && <Choices label={t('client.cliGui.mode')} value={state.mode}
        options={catalog.modes.map(mode => ({ id: mode.id, label: cliModeLabel(engine, mode) }))}
        disabled={disabled || Boolean(selected)} choose={mode => controller.patch({ mode })} />}
      <button type="button" className="chat-button" disabled={disabled || Boolean(selected?.permissions.length)}
        onClick={() => { close(); void controller.install(); }}>{t('client.cliGui.update')}</button>
    </div>
  </ChatSettingsSheet>;
}

export function MobileCliSettings({ connection, connected = true, active = true }: {
  connection?: ChatConnectionProps; connected?: boolean; active?: boolean;
}) {
  const { state } = useCliGui()!;
  const [open, setOpen] = useState(false);
  useLanguage();
  useEffect(() => { setOpen(false); }, [state.engine, state.selected?.id, active]);
  const model = state.catalog?.models.find(entry => entry.id === state.model);
  const name = model?.label || t('client.shared.syncingModels');
  return <>
    <button type="button" className="chat-model" aria-haspopup="dialog" aria-expanded={open}
      aria-label={t('client.mobile.chatSettings', { value1: name })} onClick={() => setOpen(true)}>
      <span className="chat-model-name">{name}</span>
      <span className="chat-model-effort">{model?.efforts?.find(entry => entry.id === state.effort)?.label}</span>
    </button>
    {open && active && <Settings connection={connection} connected={connected} active={active}
      close={() => setOpen(false)} />}
  </>;
}
