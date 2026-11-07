import { SYNC_CHUNK_BYTES, type SyncBundle, type SyncHost, type SyncPlan, type SyncSource } from './types';

export interface PreparedSync {
  id: string;
  plan: SyncPlan;
  remote?: { host: SyncHost; bundle: SyncBundle };
}

export async function prepareSync(options: {
  source: SyncSource; destination: SyncHost; sessionIds: string[]; signal: AbortSignal;
}): Promise<PreparedSync> {
  const { source, destination, sessionIds, signal } = options;
  const sameHost = source.host.id === destination.id;
  let exported: SyncBundle | undefined;
  let imported: SyncBundle | undefined;
  try {
    signal.throwIfAborted();
    exported = await source.host.request<SyncBundle>({
      action: sameHost ? 'prepare' : 'export', homeId: source.home.id, sessionIds,
    });
    signal.throwIfAborted();
    imported = sameHost ? exported : await destination.request<SyncBundle>({
      action: 'begin', size: exported.size, sha256: exported.sha256,
    });
    signal.throwIfAborted();
    const plan = await destination.request<SyncPlan>({ action: 'plan', id: imported.id,
      ...(!sameHost ? { sessionIds: exported.sessionIds } : {}) });
    return { id: imported.id, plan, ...(!sameHost ? { remote: { host: source.host, bundle: exported } } : {}) };
  } catch (error) {
    if (imported) await closeTransfer(destination, imported.id);
    else if (sameHost && exported) await closeTransfer(source.host, exported.id);
    if (!sameHost && exported) await closeTransfer(source.host, exported.id);
    throw error;
  }
}

export async function uploadPreparedSync(options: {
  prepared: PreparedSync; destination: SyncHost; signal: AbortSignal;
  progress: (fraction: number, bytes: number) => void;
}) {
  const { prepared, destination, signal, progress } = options;
  const remote = prepared.remote;
  if (!remote) return;
  const { host, bundle } = remote;
  for (let offset = 0; offset < bundle.size; offset += SYNC_CHUNK_BYTES) {
    signal.throwIfAborted();
    const { data } = await host.request<{ data: string }>({ action: 'read', id: bundle.id, offset });
    signal.throwIfAborted();
    await destination.request({ action: 'write', id: prepared.id, offset, data });
    const bytes = Math.min(SYNC_CHUNK_BYTES, bundle.size - offset);
    progress(Math.min(1, (offset + bytes) / bundle.size), bytes);
  }
  signal.throwIfAborted();
}

export async function closePreparedSync(destination: SyncHost, prepared: PreparedSync) {
  await closeTransfer(destination, prepared.id);
  if (prepared.remote) await closeTransfer(prepared.remote.host, prepared.remote.bundle.id);
}

export async function closeTransfer(host: SyncHost, id: string) {
  try { await host.request({ action: 'close', id }); }
  catch { /* The host also expires abandoned temporary bundles. Source data has not been removed. */ }
}
