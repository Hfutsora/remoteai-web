import type { BrowserHomeTransport, BrowserHomeView } from '../useNavigationBrowserHome';
import { homeDocument } from './document';
import { digestPattern, parsePackage, readPackage } from './package';

interface CachedHome { enabled: boolean; md5: string }
const CACHE = 'remoteai-browser-home-packages';
const key = (base: string) => `remoteai:browser-home:${base.replace(/\/+$/, '')}`;
const packageUrl = (base: string, md5: string) => `${base.replace(/\/+$/, '')}/browser-home/packages/${md5}`;
const documents = new Map<string, Promise<BrowserHomeView>>();
function read(base: string): CachedHome | null {
  try {
    const value = JSON.parse(localStorage.getItem(key(base)) ?? 'null') as CachedHome | null;
    return value && digestPattern.test(value.md5) ? value : null;
  } catch { return null; }
}
const write = (base: string, value: CachedHome) => localStorage.setItem(key(base), JSON.stringify(value));

async function display(base: string, md5: string, bytes: Uint8Array) {
  const id = packageUrl(base, md5);
  let document = documents.get(id);
  if (!document) {
    document = homeDocument(parsePackage(bytes, md5), base).then(html => ({
      md5, url: URL.createObjectURL(new Blob([html], { type: 'text/html' })),
    })).catch(error => { documents.delete(id); throw error; });
    documents.set(id, document);
  }
  return document;
}

async function cached(base: string, md5: string, signal: AbortSignal) {
  const cache = await caches.open(CACHE);
  const response = await cache.match(packageUrl(base, md5));
  return response ? display(base, md5, await readPackage(response, signal)) : null;
}

async function check(base: string, signal: AbortSignal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener('abort', abort, { once: true });
  const timeout = window.setTimeout(abort, 60_000);
  try { signal.throwIfAborted(); return await update(base, controller.signal); }
  finally { window.clearTimeout(timeout); signal.removeEventListener('abort', abort); }
}

async function update(base: string, signal: AbortSignal) {
  const init: RequestInit = { signal, cache: 'no-store', credentials: 'omit' };
  const response = await fetch(`${base.replace(/\/+$/, '')}/browser-home/current`, init);
  if (!response.ok) throw new Error('Home configuration unavailable');
  const config: unknown = await response.json();
  if (!config || typeof config !== 'object' || !('enabled' in config)) throw new Error('Invalid home configuration');
  const previous = read(base);
  if (config.enabled === false) {
    if (previous) write(base, { ...previous, enabled: false });
    return null;
  }
  if (config.enabled !== true || !('md5' in config) || typeof config.md5 !== 'string'
    || !digestPattern.test(config.md5)) throw new Error('Invalid home checksum');
  if (previous?.md5 === config.md5) {
    const value = await cached(base, previous.md5, signal).catch(() => null);
    if (value) { write(base, { ...previous, enabled: true }); return value; }
  }
  const url = packageUrl(base, config.md5);
  const bytes = await readPackage(await fetch(url, init), signal);
  const value = await display(base, config.md5, bytes);
  signal.throwIfAborted();
  await (await caches.open(CACHE)).put(url, new Response(bytes));
  signal.throwIfAborted();
  write(base, { md5: config.md5, enabled: true });
  return value;
}

export const browserHomeTransport: BrowserHomeTransport = {
  async readCached(base) {
    const value = read(base);
    return value?.enabled ? cached(base, value.md5, new AbortController().signal) : null;
  },
  check,
};
