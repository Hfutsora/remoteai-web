import { SYNC_HOME_ID, type SyncHome } from './types';

const GUI_APP_DIRECTORY = 'dev.codex.switch';
const GUI_HOME_NAME = 'CodexGUI';

export function syncSourceLabel(computer: string, home: SyncHome) {
  const gui = home.id === SYNC_HOME_ID || home.path.toLowerCase().includes(GUI_APP_DIRECTORY);
  return `${computer} · ${gui ? GUI_HOME_NAME : home.path}`;
}
