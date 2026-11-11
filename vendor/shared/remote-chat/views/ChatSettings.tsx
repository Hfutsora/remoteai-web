import { displayText, displayError } from '../../localization/browserClient';
import { t, useLanguage } from '../../localization/browserClient';
import { useState } from 'react';
import { useDesktopLayout } from '../../layout/useDesktopLayout';
import { AdaptiveSheet } from '../../layout/AdaptiveSheet';
import { ChatUsage } from './ChatUsage';
import { ChatContextSettings } from './ChatContextSettings';
import { ChatProfileMenu, type ChatConnectionProps } from './ChatProfileMenu';
import { ModelRefreshButton } from './ModelRefreshButton';
import { ChatSettingSegments } from './ChatSettingSegments';
import { ChatSettingsSheet } from './ChatSettingsSheet';
import type { ContextSettingsApi } from '../contextSettings';
import type { ReadUsage } from '../usage';
import type { ReadConversationMetrics } from '../conversationMetrics';
import type { Model, ThreadTokenUsage } from './types';
import type { ComposerSettings } from '../composer';
import { SETTINGS_FIELDS, settingOptions, settingValue, settingsNotice, visibleSettingsFields,
  type SettingField } from '../settingsMenu';

interface Props {
  connection: ChatConnectionProps;
  cliLocked?: boolean;
  cwd?: string;
  threadId: string | null;
  contextSettings: ContextSettingsApi;
  tokenUsage?: ThreadTokenUsage;
  readUsage: ReadUsage;
  readConversationMetrics: ReadConversationMetrics;
  models: Model[];
  selection: ComposerSettings;
  saving: boolean;
  ready: boolean;
  error: string;
  updateSettings: (settings: Partial<ComposerSettings>) => Promise<void>;
  refreshModels: () => Promise<void>;
  onClose: () => void;
}

export function ChatSettings({ models, selection, saving, ready, error, updateSettings, refreshModels, onClose,
  readUsage, readConversationMetrics, tokenUsage, threadId, contextSettings, connection,
  cliLocked = false, cwd }: Props) {
  useLanguage();
  const desktop = useDesktopLayout();
  const [field, setField] = useState<SettingField | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const notice = settingsNotice({ saving, ready, error });
  const selectInline = (field: SettingField, value: string) => {
    if (value !== selection[field] || error) void updateSettings({ [field]: value });
  };
  const choose = async (value: string) => {
    if (!field) return;
    if (value !== selection[field] || error) await updateSettings({ [field]: value });
    setField((current) => current === field ? null : current);
  };
  const usage = <ChatUsage read={readUsage} active={!field && !contextOpen} ready={ready} tokenUsage={tokenUsage}
    card={!desktop} readConversationMetrics={readConversationMetrics} threadId={threadId}
    onContextSettings={threadId ? () => setContextOpen(true) : undefined} />;
  return <ChatSettingsSheet hideHeader onClose={onClose}>
    <div className={`chat-settings${desktop ? '' : ' chat-settings-mobile'}`} aria-hidden={field !== null || contextOpen}>
      {!desktop && usage}
      <ChatProfileMenu {...connection} variant="settings" compact={!desktop} ready={ready}
        cliLocked={Boolean(threadId) || cliLocked} cliCwd={cwd} />
      {visibleSettingsFields(selection).map((entry) => entry.field !== 'model'
        ? <ChatSettingSegments key={entry.field} field={entry.field} compact={!desktop}
          label={displayText(entry.label)} value={selection[entry.field] ?? ''}
          options={settingOptions(entry.field, models, selection)} onChange={value => selectInline(entry.field, value)}
          inactive={field !== null || contextOpen} />
        : <button key={entry.field} type="button"
        className="chat-setting-entry"
        aria-label={t("client.chat.set", { value1: displayText(entry.label) })} onClick={() => setField(entry.field)} tabIndex={field ? -1 : 0}>
        <strong>{displayText(entry.label)}</strong><span>
          {settingValue(entry.field, models, selection, displayText)}</span>
        <span aria-hidden="true">›</span>
      </button>)}
      {!!notice && <p role={error ? 'alert' : 'status'} className={error ? 'chat-error' : 'chat-muted'}>{displayError(notice)}</p>}
      {!!error && <button type="button" className="chat-button" onClick={() => { void updateSettings(selection); }}>
        {t("client.chat.saveAgain")}</button>}
      {desktop && usage}
    </div>
    {field && <AdaptiveSheet open title={displayText(SETTINGS_FIELDS.find((entry) => entry.field === field)!.title)} width={400}
      titleAction={field === 'model' ? <ModelRefreshButton ready={ready} refreshModels={refreshModels} /> : undefined}
      onBack={() => setField(null)} onClose={() => setField(null)}>
      <div className="chat-settings chat-setting-options" role="radiogroup">
        {settingOptions(field, models, selection).map((option) => <button key={option.value}
          type="button" role="radio" aria-label={field === 'model' ? option.label : displayText(option.label)} aria-checked={selection[field] === option.value}
          className="chat-setting-option" onClick={() => { void choose(option.value); }}>
          <span className="chat-row"><strong className="chat-grow">{field === 'model' ? option.label : displayText(option.label)}</strong>
            {selection[field] === option.value && <span aria-hidden="true">✓</span>}</span>
          {option.description && <small>{displayText(option.description)}</small>}
        </button>)}
      </div>
    </AdaptiveSheet>}
    {contextOpen && threadId && <ChatContextSettings threadId={threadId} api={contextSettings}
      onClose={() => setContextOpen(false)} />}
  </ChatSettingsSheet>;
}
