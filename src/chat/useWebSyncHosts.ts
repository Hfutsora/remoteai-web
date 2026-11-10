import { useEffect, useMemo } from 'react';
import { remoteSyncHost } from '../../../../shared/conversation/sync/remote';
import { ChatConnection } from '../../../../shared/remote-chat/client/connection';
import { createBrowserPacketCompression } from '../../../../shared/remote-chat/browserPacketCompression';
import { RtcPeer } from '../../../../shared/remote-chat/rtcPeer';
import { browserTrustStore, trustedHost, trustScope } from '../../../../shared/remote-chat/trustedHost';
import { apiJson, getActiveSession, refreshSession } from '../api';
import type { AuthSession, RemoteDevice } from '../types';

import { syncHosts, notifySyncHosts } from '../../../../shared/conversation/sync/downloads';
import { downloadOwner } from '../../../../shared/downloads/manager';

export function useWebSyncHosts(session: AuthSession, devices: RemoteDevice[]) {
  const signature = JSON.stringify(devices.filter(device => device.online)
    .map(({ deviceId, name }) => ({ deviceId, name })));
  const hosts = useMemo(() => syncHosts(downloadOwner(session), (JSON.parse(signature) as Pick<RemoteDevice, 'deviceId' | 'name'>[])
    .map(device => ({ id: device.deviceId, create: () => remoteSyncHost({ id: device.deviceId, name: device.name,
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
    }) }))), [session.baseUrl, session.email, signature]);
  useEffect(() => { notifySyncHosts(); }, [hosts]);
  return hosts;
}

export function WebSyncDownloads({ session, devices }: { session: AuthSession; devices: RemoteDevice[] }) {
  useWebSyncHosts(session, devices);
  return null;
}
