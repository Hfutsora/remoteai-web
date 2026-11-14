import { md5 } from '@noble/hashes/legacy';
import { bytesToHex } from '@noble/hashes/utils';

export interface HomeBundle { revision: string; files: { path: string; contentType: string; data: string }[] }
export const digestPattern = /^[a-f0-9]{32}$/;
export const MAX_PACKAGE_BYTES = 160 * 1024 * 1024;

export function packageDigest(data: Uint8Array) { return bytesToHex(md5(data)); }

export async function readPackage(response: Response, signal: AbortSignal): Promise<Uint8Array> {
  if (!response.ok || Number(response.headers.get('Content-Length') ?? 0) > MAX_PACKAGE_BYTES || !response.body) {
    throw new Error('Home package unavailable');
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      signal.throwIfAborted();
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_PACKAGE_BYTES) throw new Error('Home package exceeds cache limit');
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const data = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
  return data;
}

export function parsePackage(data: Uint8Array, expected: string): HomeBundle {
  if (!digestPattern.test(expected) || packageDigest(data) !== expected) throw new Error('Home package checksum mismatch');
  const bundle = JSON.parse(new TextDecoder().decode(data)) as HomeBundle;
  if (!bundle || !/^[a-f0-9-]{36}$/.test(bundle.revision) || !Array.isArray(bundle.files)
    || !bundle.files.length || bundle.files.length > 2000) throw new Error('Invalid home package');
  const paths = new Set<string>();
  for (const file of bundle.files) {
    if (!file || typeof file.path !== 'string' || !file.path || file.path.length > 512
      || file.path.split('/').some(part => !part || part === '.' || part === '..')
      || /[\\:%?#"'<>`\x00-\x1f\x7f-\x9f]/.test(file.path) || paths.has(file.path.toLowerCase())
      || typeof file.data !== 'string' || typeof file.contentType !== 'string') throw new Error('Invalid home file');
    paths.add(file.path.toLowerCase());
  }
  if (!bundle.files.some(file => file.path === 'index.html')) throw new Error('Home entry missing');
  return bundle;
}
