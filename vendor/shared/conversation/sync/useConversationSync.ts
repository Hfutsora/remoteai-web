import { useCallback, useEffect, useRef, useState } from 'react';
import { closePreparedSync, prepareSync, uploadPreparedSync, type PreparedSync } from './transfer';
import { SYNC_HOME_ID, type SyncDirectory, type SyncHost, type SyncResult, type SyncSource,
  type SyncThread, type SyncProvider } from './types';
import { uiText } from '../../localization/uiText';

export function useSyncSources(hosts: SyncHost[], destination: SyncHost) {
  const [sources, setSources] = useState<SyncSource[]>([]);
  const [failures, setFailures] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [attempt, retry] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void Promise.allSettled(hosts.map(async host => {
      const directory = await host.request<SyncDirectory>({ action: 'homes' });
      return directory.homes.filter(home => host.id !== destination.id || home.id !== SYNC_HOME_ID)
        .map(home => ({ key: JSON.stringify([host.id, home.id]), host, home,
          label: `${host.name || directory.name} · ${home.path}` }));
    })).then(results => {
      if (cancelled) return;
      setSources(results.flatMap(result => result.status === 'fulfilled' ? result.value : []));
      setFailures(results.flatMap((result, index) => result.status === 'rejected'
        ? [hosts[index].name || uiText('client.git.local')] : []));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [hosts, destination.id, attempt]);
  return { sources, failures, loading, retry: () => retry(value => value + 1) };
}

export function useSyncThreads(source?: SyncSource) {
  const [listedSource, setListedSource] = useState(source?.key);
  const [threads, setThreads] = useState<SyncThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [revision, refresh] = useState(0);
  const generation = useRef(0);
  useEffect(() => {
    setListedSource(source?.key); setQuery(''); setSelected([]); setThreads([]);
  }, [source?.key]);
  useEffect(() => {
    const id = ++generation.current;
    if (!source) return;
    setLoading(true); setError(undefined);
    const timer = setTimeout(() => {
      void source.host.request<SyncThread[]>({ action: 'list', homeId: source.home.id, query })
        .then(result => {
          if (generation.current !== id) return;
          setThreads(result);
          setSelected(current => current.filter(id => result.some(thread => thread.sessionId === id)));
        }).catch(error => { if (generation.current === id) setError(error); })
        .finally(() => { if (generation.current === id) setLoading(false); });
    }, query ? 300 : 0);
    return () => { clearTimeout(timer); generation.current += 1; };
  }, [source?.key, query, revision]);
  const currentSource = listedSource === source?.key;
  return { threads: currentSource ? threads : [], loading: loading || !currentSource,
    error: currentSource ? error : undefined, query: currentSource ? query : '', setQuery,
    selected: currentSource ? selected : [], setSelected,
    refresh: () => refresh(value => value + 1) };
}

export function useConversationSync(options: {
  destination: SyncHost; source?: SyncSource; selected: string[]; complete: (result: SyncResult) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [prepared, setPrepared] = useState<PreparedSync>();
  const [error, setError] = useState<unknown>();
  const [overwrite, setOverwrite] = useState(false);
  const [provider, setProvider] = useState<SyncProvider>('codex-switch-gui');
  const abort = useRef<AbortController>();
  const preparedRef = useRef<PreparedSync>();
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const complete = useRef(options.complete); complete.current = options.complete;
  const destination = options.destination;
  const meter = useSyncProgress(options.source, destination);
  const cancel = useCallback(() => {
    abort.current?.abort();
    meter.stop();
    const current = preparedRef.current;
    preparedRef.current = undefined;
    if (current) void closePreparedSync(destination, current);
    setOpen(false); setPrepared(undefined);
  }, [destination]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abort.current?.abort();
      if (preparedRef.current) void closePreparedSync(destination, preparedRef.current);
    };
  }, [destination]);
  const show = async () => {
    if (inFlight.current || !options.source || !options.selected.length) return;
    inFlight.current = true;
    const controller = new AbortController(); abort.current = controller;
    setOpen(true); setBusy(true); setError(undefined); setOverwrite(false); meter.reset();
    setPrepared(undefined); setProvider('codex-switch-gui');
    try {
      const result = await prepareSync({ source: options.source, destination,
        sessionIds: [...options.selected], signal: controller.signal });
      if (!mounted.current || controller.signal.aborted) {
        await closePreparedSync(destination, result); return;
      }
      preparedRef.current = result; setPrepared(result);
    } catch (error) {
      if (mounted.current && !controller.signal.aborted) setError(error);
    } finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  };
  const commit = async () => {
    if (inFlight.current || !prepared) return;
    inFlight.current = true;
    const controller = new AbortController(); abort.current = controller;
    setBusy(true); setError(undefined);
    const needsTransfer = prepared.remote && (overwrite || prepared.plan.count > prepared.plan.duplicateIds.length);
    try {
      if (needsTransfer) {
        setTransferring(true); meter.start();
        await uploadPreparedSync({ prepared, destination, signal: controller.signal, progress: meter.add });
        meter.stop(); setTransferring(false);
      }
      controller.signal.throwIfAborted();
      setCommitting(true);
      const result = await destination.request<SyncResult>({ action: 'commit', id: prepared.id,
        overwriteIds: overwrite ? prepared.plan.duplicateIds : [], modelProvider: provider });
      if (mounted.current) { complete.current(result); cancel(); }
    } catch (error) {
      if (mounted.current && !controller.signal.aborted) setError(error);
    } finally {
      inFlight.current = false; meter.stop();
      if (mounted.current) { setBusy(false); setCommitting(false); setTransferring(false); }
    }
  };
  return { open, busy, committing, transferring, progress: meter.progress, transfer: meter.transfer,
    prepared, error, overwrite, setOverwrite, provider, setProvider, cancel, show, commit };
}

const SPEED_SAMPLE_MS = 500;
function useSyncProgress(source: SyncSource | undefined, destination: SyncHost) {
  const [progress, setProgress] = useState(0);
  const [transfer, setTransfer] = useState({ bytesPerSecond: 0, mode: 'connecting' });
  const timer = useRef<ReturnType<typeof setInterval>>();
  const mounted = useRef(true);
  const sample = useRef({ bytes: 0, lastBytes: 0, startedAt: 0, lastAt: 0, transferredAt: 0 });
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearInterval(timer.current); };
  }, []);
  const reset = () => {
    clearInterval(timer.current);
    sample.current = { bytes: 0, lastBytes: 0, startedAt: 0, lastAt: 0, transferredAt: 0 };
    setProgress(0); setTransfer({ bytesPerSecond: 0, mode: transferMode(source, destination) });
  };
  const stop = () => {
    clearInterval(timer.current);
    const current = sample.current;
    if (mounted.current) setTransfer({ mode: transferMode(source, destination),
      bytesPerSecond: current.bytes * 1000 / Math.max(1, current.transferredAt - current.startedAt) });
  };
  const start = () => {
    reset();
    sample.current.startedAt = performance.now(); sample.current.lastAt = performance.now();
    timer.current = setInterval(() => {
      const now = performance.now();
      const current = sample.current;
      setTransfer({ bytesPerSecond: (current.bytes - current.lastBytes) * 1000 / (now - current.lastAt),
        mode: transferMode(source, destination) });
      current.lastBytes = current.bytes; current.lastAt = now;
    }, SPEED_SAMPLE_MS);
  };
  const add = (fraction: number, bytes: number) => {
    sample.current.bytes += bytes; sample.current.transferredAt = performance.now();
    if (mounted.current) {
      setProgress(fraction);
      const current = sample.current;
      setTransfer({ bytesPerSecond: current.bytes * 1000 / Math.max(1, current.transferredAt - current.startedAt),
        mode: transferMode(source, destination) });
    }
  };
  return { progress, transfer, reset, start, stop, add };
}

function transferMode(source: SyncSource | undefined, destination: SyncHost) {
  const paths = [source?.host.mode?.(), destination.mode?.()].filter(Boolean);
  if (paths.includes('relay')) return 'relay';
  return paths.length && paths.every(mode => mode === 'direct') ? 'direct' : 'connecting';
}
