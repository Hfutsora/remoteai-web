import { ExternalLink } from 'lucide-react';
import { isTauri } from '@tauri-apps/api/core';
import { openUrl } from '@tauri-apps/plugin-opener';
import { message } from 'antd';
import { uiText } from '../localization/uiText';
import type { ExternalEngine } from './types';

// Keep installation entry points on the vendors' official domains on every host.
export const officialInstallUrls: Record<ExternalEngine, string> = {
  claude: 'https://code.claude.com/docs/en/setup#install-claude-code',
  gemini: 'https://geminicli.com/docs/get-started/installation/',
};

export function CliInstallLink({ engine }: { engine: ExternalEngine }) {
  const url = officialInstallUrls[engine];
  return <a className="cli-gui-install-link" href={url} target="_blank" rel="noopener noreferrer"
    onClick={event => {
      if (!isTauri()) return;
      event.preventDefault();
      void openUrl(url).catch(() => { void message.error({
        content: uiText('client.conversation.couldNotOpenTheLinkPleaseTryAgainShortly'),
        style: { maxWidth: 400, marginInline: 'auto' },
      }); });
    }}>
    {uiText('client.cliGui.officialInstall', { cli: engine === 'claude' ? 'Claude Code' : 'Gemini CLI' })}
    <ExternalLink size={12} aria-hidden="true" />
  </a>;
}
