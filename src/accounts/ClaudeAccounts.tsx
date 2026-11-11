import { useState } from 'react';
import { Select, Space, Typography } from 'antd';
import { ClaudeAccountsPanel } from '../../../../shared/accounts/ClaudeAccountsPanel';
import { uiText } from '../../../../shared/localization/uiText';
import type { AuthSession, RemoteDevice } from '../types';
import { useChat } from '../chat/useChat';

export function ClaudeAccounts({ session, devices, preferredDevice, add, onAdded, privacyMode }: {
  session: AuthSession; devices: RemoteDevice[]; preferredDevice?: string | null;
  add: boolean; onAdded: () => void; privacyMode: boolean;
}) {
  const [selected, setSelected] = useState<string>();
  const online = devices.filter(device => device.online);
  const deviceId = online.find(device => device.deviceId === (selected ?? preferredDevice))?.deviceId
    ?? online[0]?.deviceId ?? '';
  return <section className="claude-accounts-section">
    <Space wrap style={{ marginBottom: '1em' }}>
      <Typography.Text strong>Claude Code</Typography.Text>
      <Select aria-label={uiText('client.officialAccounts.selectDevice')} value={deviceId || undefined}
        placeholder={uiText('client.officialAccounts.selectDevice')} onChange={setSelected} style={{ minWidth: 220 }}
        options={online.map(device => ({ label: device.name, value: device.deviceId }))} />
    </Space>
    <ConnectedClaudeAccounts key={deviceId} session={session} deviceId={deviceId}
      add={add} onAdded={onAdded} privacyMode={privacyMode} />
  </section>;
}

function ConnectedClaudeAccounts({ session, deviceId, ...props }: {
  session: AuthSession; deviceId: string; add: boolean; onAdded: () => void; privacyMode: boolean;
}) {
  const chat = useChat(session, deviceId, false);
  return <ClaudeAccountsPanel {...props} transport={chat.controller.claudeAccounts}
    ready={chat.state.ready && Boolean(deviceId)} />;
}
