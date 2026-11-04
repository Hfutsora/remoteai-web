import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

async function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'remoteai-web-workspace-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (relative, contents) => {
    const filename = path.join(root, relative);
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, contents);
  };
  write('package.json', JSON.stringify({ version: '9.8.7', type: 'module' }));
  write('src/screen.ts', 'export const value = 1;');
  write('vendor/shared/example.ts', 'export const shared = true;');
  write('node_modules/@remoteai/i18n/src/index.ts', 'export {};');
  write('node_modules/@remoteai/i18n/package.json', '{"name":"@remoteai/i18n"}');
  write('playwright.startup-update.config.ts', 'export default {};');
  write('scripts/workspace.mjs', fs.readFileSync(new URL('./workspace.mjs', import.meta.url)));
  const workspace = await import(pathToFileURL(path.join(root, 'scripts/workspace.mjs')).href);
  return { root, write, ...workspace };
}

test('standalone preparation reconstructs host paths and uses the Web repository version', async t => {
  const f = await fixture(t);
  f.prepareWorkspace();
  assert.equal(fs.readFileSync(path.join(f.application, 'src/screen.ts'), 'utf8'), 'export const value = 1;');
  assert.equal(fs.readFileSync(path.join(f.workspace, 'shared/example.ts'), 'utf8'), 'export const shared = true;');
  assert.equal(JSON.parse(fs.readFileSync(path.join(f.workspace, 'package.json'), 'utf8')).version, '9.8.7');
  assert.ok(fs.existsSync(path.join(f.application, 'playwright.startup-update.config.ts')));
  f.write('src/screen.ts', 'export const value = 2;');
  f.copySourceChange(path.join(f.root, 'src/screen.ts'));
  assert.equal(fs.readFileSync(path.join(f.application, 'src/screen.ts'), 'utf8'), 'export const value = 2;');
  f.copySourceChange(path.join(f.root, 'src/screen.ts'), true);
  assert.ok(!fs.existsSync(path.join(f.application, 'src/screen.ts')));
  assert.ok(fs.existsSync(path.join(f.root, 'src/screen.ts')));
});

test('workspace cleanup rejects directory links and source updates cannot escape the repository', async t => {
  const f = await fixture(t);
  const outside = path.join(f.root, 'retained');
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'keep.txt'), 'keep');
  fs.symlinkSync(outside, f.workspace, 'junction');
  assert.throws(() => f.prepareWorkspace(), /must not be a link/);
  assert.equal(fs.readFileSync(path.join(outside, 'keep.txt'), 'utf8'), 'keep');
  assert.throws(() => f.copySourceChange(path.join(f.root, '../outside.ts')), /outside/);
});
