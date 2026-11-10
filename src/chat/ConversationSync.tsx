import { ConversationSyncDialog, SyncDialogPanel } from '../../../../shared/conversation/sync/ConversationSyncDialog';
import type { AuthSession, RemoteDevice } from '../types';
import { useWebSyncHosts } from './useWebSyncHosts';

interface Props {
  session: AuthSession; devices: RemoteDevice[]; deviceId: string; onSynced: () => void; active: boolean;
}

export function ConversationSync(props: Props) {
  return <ConversationSyncDialog active={props.active}><WebSyncContent {...props} /></ConversationSyncDialog>;
}

function WebSyncContent({ session, devices, deviceId, onSynced }: Props) {
  const hosts = useWebSyncHosts(session, devices);
  const destination = hosts.find(host => host.id === deviceId);
  return destination ? <SyncDialogPanel hosts={hosts} destination={destination} onSynced={onSynced} /> : null;
}
