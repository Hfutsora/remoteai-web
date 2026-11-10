import { Button, Popover } from 'antd';
import { Download, RefreshCw } from 'lucide-react';
import { uiText } from '../localization/uiText';
import { useCliGui } from './context';
import { CliInstaller } from './CliInstaller';

export function CliRuntimeTools() {
  const cli = useCliGui();
  if (!cli || cli.state.engine === 'codex') return null;
  const busy = cli.state.busy || cli.state.selected?.status === 'running';
  return <>
    <Button type="text" icon={<RefreshCw size={16} />} disabled={busy}
      aria-label={uiText('client.cliGui.refresh')} onClick={() => { void cli.controller.refresh(); }} />
    <Popover trigger="click" placement="bottomRight" styles={{ root: { maxWidth: 400 } }}
      content={<CliInstaller compact />}>
      <Button type="text" icon={<Download size={16} />} aria-label={uiText('client.cliGui.update')} />
    </Popover>
  </>;
}
