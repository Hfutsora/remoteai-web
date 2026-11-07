import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const workspace = path.join(root, '.workspace');
export const application = path.join(workspace, 'apps/web');
export const sourceDirectories = ['src', 'public', 'e2e', 'build', 'scripts'];
export const sourceFiles = () => fs.readdirSync(root).filter(filename =>
  /^(?:.*\.html|tsconfig.*\.json|package\.json|\.env(?:\..*)?)$/
    .test(filename));

function resetGeneratedDirectory(directory) {
  if (!directory.startsWith(workspace + path.sep)) throw new Error('Invalid generated workspace path.');
  if (fs.lstatSync(directory, { throwIfNoEntry: false })?.isSymbolicLink()) {
    throw new Error('Generated workspace directories must not be links.');
  }
  fs.rmSync(directory, { recursive: true, force: true });
}

/** Preserve shared source paths without making a standalone build depend on a parent checkout. */
export function prepareWorkspace() {
  if (fs.lstatSync(workspace, { throwIfNoEntry: false })?.isSymbolicLink()) {
    throw new Error('The generated workspace must not be a link.');
  }
  for (const name of ['apps', 'shared', 'scripts', 'packages']) resetGeneratedDirectory(path.join(workspace, name));
  for (const name of ['apps', 'shared', 'scripts']) {
    const source = path.join(root, 'vendor', name);
    if (fs.existsSync(source)) fs.cpSync(source, path.join(workspace, name), { recursive: true });
  }
  fs.mkdirSync(application, { recursive: true });
  for (const name of [...sourceDirectories, ...sourceFiles()]) {
    const source = path.join(root, name);
    if (fs.existsSync(source)) fs.cpSync(source, path.join(application, name), { recursive: true });
  }
  const metadata = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  fs.writeFileSync(path.join(workspace, 'package.json'),
    JSON.stringify({ private: true, type: 'module', version: metadata.version }));
  // Node fixtures use the package's source JSON; application code uses its public exports.
  const language = path.join(root, 'node_modules/@remoteai/i18n');
  fs.cpSync(path.join(language, 'src'), path.join(workspace, 'packages/i18n/src'), { recursive: true });
  fs.copyFileSync(path.join(language, 'package.json'), path.join(workspace, 'packages/i18n/package.json'));
  return { workspace, application };
}

export function copySourceChange(filename, removed = false) {
  const relative = path.relative(root, filename);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('Source is outside the Web repository.');
  const target = path.join(application, relative);
  if (removed) { fs.rmSync(target, { force: true }); return; }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(filename, target);
}

export function preserveBrowserResults() {
  const results = path.join(workspace, '.codex-tmp');
  if (fs.existsSync(results)) fs.cpSync(results, path.join(root, 'test-results'), { recursive: true });
}
