import { invoke } from '@tauri-apps/api/core';

export type InspectorDock = 'right' | 'bottom' | 'window';
export interface InspectorTarget { id: string; kind: 'provider' | 'conversation' }
export interface InspectorPlacement {
  action: 'place'; dock: InspectorDock; visible: boolean;
  bounds: { x: number; y: number; width: number; height: number };
}
type Command = InspectorPlacement | { action: 'status' | 'close' };
const operations = new Map<string, Promise<boolean>>();
const owners = new Map<string, symbol>();
const targetKey = (target: InspectorTarget) => `${target.kind}:${target.id}`;

export function inspectorCommand(target: InspectorTarget, command: Command) {
  const key = targetKey(target);
  const previous = operations.get(key) ?? Promise.resolve(false);
  const operation = previous.catch(() => false)
    .then(() => invoke<boolean>('browser_inspector', { request: { ...target, command } }));
  operations.set(key, operation);
  const cleanup = () => { if (operations.get(key) === operation) operations.delete(key); };
  void operation.then(cleanup, cleanup);
  return operation;
}

/** Coalesce geometry updates; retiring a surface hides only after its last placement completes. */
export function inspectorSession(target: InspectorTarget, onError: () => void) {
  const key = targetKey(target);
  const owner = Symbol(key); owners.set(key, owner);
  let pending: InspectorPlacement | undefined;
  let flight: Promise<void> | undefined;
  let stopped = false;
  let last: InspectorPlacement | undefined;
  const flush = async () => {
    while (pending) {
      const request = pending; pending = undefined;
      try { await inspectorCommand(target, request); last = request; }
      catch { if (!stopped) onError(); }
    }
  };
  return {
    update(request: InspectorPlacement) {
      if (stopped || owners.get(key) !== owner) return;
      pending = request;
      if (!flight) flight = flush().finally(() => { flight = undefined; });
    },
    async stop() {
      stopped = true; pending = undefined; await flight;
      if (owners.get(key) !== owner) return;
      owners.delete(key);
      if (last) await inspectorCommand(target, { ...last, visible: false });
    },
  };
}
