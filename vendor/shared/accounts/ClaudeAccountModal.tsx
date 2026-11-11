import { useEffect, useState } from 'react';
import { Alert, Button, Input, Modal, Space, Typography } from 'antd';
import { ExternalLink, FolderInput, Terminal } from 'lucide-react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { isDesktopApp } from '../platform/localBackend';
import { uiText } from '../localization/uiText';
import { useGuiLanguage } from '../localization/useGuiLanguage';
import { useClaudeLogin } from './useClaudeLogin';
import type { ClaudeAccountTransport } from './claudeAccounts';

export function ClaudeAccountModal({ transport, accountId, onSaved, onClose }: {
  transport: ClaudeAccountTransport; accountId?: string; onSaved: () => void; onClose: () => void;
}) {
  useGuiLanguage();
  const login = useClaudeLogin({ transport, accountId, onSaved });
  const [code, setCode] = useState('');
  const url = login.status?.authorizationUrl;
  const open = () => { if (url && isDesktopApp) void openUrl(url); };
  useEffect(() => {
    if (!url) return;
    // Browsers may block asynchronous popups; the explicit link remains available.
    if (isDesktopApp) void openUrl(url).catch(() => undefined);
    else window.open(url, '_blank', 'noopener,noreferrer');
  }, [url]);
  const pending = login.busy || login.status?.status === 'verifying';
  return <Modal open centered width={460} title={uiText('client.officialAccounts.title')}
    onCancel={onClose} footer={null} destroyOnClose>
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {!login.method ? <>
        <Button block size="middle" icon={<Terminal size={16} />} loading={login.busy}
          onClick={() => void login.start('cli')}>{uiText('client.officialAccounts.cliLogin')}</Button>
        <Typography.Text type="secondary">{uiText('client.officialAccounts.cliHint')}</Typography.Text>
        <Button block icon={<ExternalLink size={16} />} disabled={login.busy}
          onClick={() => void login.start('pkce')}>{uiText('client.officialAccounts.pkceLogin')}</Button>
        <Typography.Text type="secondary">{uiText('client.officialAccounts.pkceHint')}</Typography.Text>
        {!accountId && <><Button block icon={<FolderInput size={16} />} loading={login.busy}
          onClick={() => void login.importCurrent()}>{uiText('client.officialAccounts.import')}</Button>
        <Typography.Text type="secondary">{uiText('client.officialAccounts.importHint')}</Typography.Text></>}
      </> : <>
        {login.method === 'pkce' && <Alert type="warning" showIcon
          message={uiText('client.officialAccounts.compatibility')} />}
        <Typography.Paragraph style={{ margin: 0 }}>{uiText(pending
          ? 'client.officialAccounts.verifying' : url ? 'client.officialAccounts.waiting'
            : 'client.officialAccounts.starting')}</Typography.Paragraph>
        {url && (isDesktopApp
          ? <Button block icon={<ExternalLink size={16} />} onClick={open}>
              {uiText('client.officialAccounts.openBrowser')}</Button>
          : <Button block icon={<ExternalLink size={16} />} href={url} target="_blank" rel="noopener noreferrer">
              {uiText('client.officialAccounts.openBrowser')}</Button>)}
        <label htmlFor="claude-authorization-code">{uiText('client.officialAccounts.code')}</label>
        <Input.TextArea id="claude-authorization-code" rows={3} value={code} autoComplete="off"
          spellCheck={false} onChange={event => setCode(event.target.value)} disabled={!url || pending} />
        <Button block type="primary" loading={pending} disabled={!url || !code.trim()}
          onClick={() => void login.submit(code).then(() => setCode(''))}>
          {uiText('client.officialAccounts.save')}</Button>
        <Button type="link" onClick={() => { setCode(''); login.back(); }}>
          {uiText('client.officialAccounts.back')}</Button>
      </>}
      {login.error && <Alert type="error" showIcon message={login.error} />}
    </Space>
  </Modal>;
}
