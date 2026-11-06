import { theme } from 'antd';
import { displayText as t } from '../localization/messages';
import { clientVersionLabel } from './clientVersion';
import type { LoungeAccount } from './types';
import './clientVersion.css';

export function LoungeClientVersion({ user, profile = false }: { user: LoungeAccount; profile?: boolean }) {
  const { token } = theme.useToken();
  const label = clientVersionLabel(user);
  if (!label) return null;
  return <span className={`lounge-client-version${profile ? ' is-profile' : ''}`}
    style={{ color: token.colorTextSecondary, fontSize: token.fontSizeSM }}>
    {profile ? `${t('client.settings.version')} ${label}` : label}
  </span>;
}
