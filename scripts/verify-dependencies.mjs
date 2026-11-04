import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const vendor = fileURLToPath(new URL('../vendor/', import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(vendor, 'source-lock.json'), 'utf8'));
for (const [relative, expected] of Object.entries(manifest.files)) {
  const filename = path.resolve(vendor, relative);
  if (!filename.startsWith(vendor)) throw new Error(`Invalid dependency manifest path: ${relative}`);
  let contents = fs.readFileSync(filename);
  if (relative === 'LICENSE' || /\.(?:[cm]?[jt]sx?|css|less|html|json|md|svg|txt|sig)$/.test(relative)) {
    contents = Buffer.from(contents.toString('utf8').replaceAll('\r\n', '\n'));
  }
  const actual = createHash('sha256').update(contents).digest('hex');
  if (actual !== expected) throw new Error(`Generated dependency changed: ${relative}. Refresh it from its source.`);
}
console.log(`Verified ${Object.keys(manifest.files).length} generated dependencies.`);
