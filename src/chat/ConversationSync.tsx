import { useEffect, useMemo } from 'react';
import { ConversationSyncDialog, SyncDialogPanel } from '../../../../shared/conversation/sync/ConversationSyncDialog';
import { remoteSyncHost } from '../../../../shared/conversation/sync/remote';
import { ChatConnection } from '../../../../shared/remote-chat/client/connection';
import { createBrowserPacketCompression } from '../../../../shared/remote-chat/browserPacketCompression';
import { RtcPeer } from '../../../../shared/remote-chat/rtcPeer';
import { browserTrustStore, trustedHost, trustScope } from '../../../../shared/remote-chat/trustedHost';
import { apiJson, getActiveSession, refreshSession } from '../api';
import type { AuthSession, RemoteDevice } from '../types';

interface Props {
  session: AuthSession; devices: RemoteDevice[]; deviceId: string; onSynced: () => void; active: boolean;
}

export function ConversationSync(props: Props) {
  return <ConversationSyncDialog active={props.active}><WebSyncContent {...props} /></ConversationSyncDialog>;
}

function WebSyncContent({ session, devices, deviceId, onSynced }: Props) {
  const signature = JSON.stringify(devices.filter(device => device.online)
    .map(({ deviceId, name }) => ({ deviceId, name })));
  const hosts = useMemo(() => (JSON.parse(signature) as Pick<RemoteDevice, 'deviceId' | 'name'>[])
    .map(device => remoteSyncHost({ id: device.deviceId, name: device.name,
      connect: events => new ChatConnection({ ...events, deviceId: device.deviceId, managePolicyMode: false,
        createPacketCompression: createBrowserPacketCompression,
        verifyHostKey: trustedHost(browserTrustStore, trustScope(session.baseUrl, device.deviceId)),
        randomBytes: length => crypto.getRandomValues(new Uint8Array(length)),
        authorize: async () => {
          await apiJson('/auth/me');
          const current = getActiveSession();
          if (!current || current.baseUrl !== session.baseUrl || current.email !== session.email) {
            throw new Error('CONVERSATION_SYNC_CLOSED');
          }
          return current;
        },
        renewAuthorization: async () => { await refreshSession(); },
        createPeer: options => new RtcPeer(options, () => new RTCPeerConnection({ iceServers: options.iceServers })),
      }),
    })), [session.baseUrl, session.email, signature]);
  useEffect(() => () => { hosts.forEach(host => host.close?.()); }, [hosts]);
  const destination = hosts.find(host => host.id === deviceId);
  return destination ? <SyncDialogPanel hosts={hosts} destination={destination} onSynced={onSynced} /> : null;
}
