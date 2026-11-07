import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { watch } from 'chokidar';
import {
  root, application, sourceDirectories, sourceFiles, prepareWorkspace, copySourceChange, preserveBrowserResults,
} from './workspace.mjs';

const require = createRequire(path.join(root, 'package.json'));
const [command, ...arguments_] = process.argv.slice(2);
const commands = new Set(['dev', 'build', 'check', 'preview', 'test', 'playwright']);
if (!commands.has(command)) throw new Error('Use an npm development, build or test command.');

function executable(packageName, binary) {
  const filename = require.resolve(`${packageName}/package.json`);
  const metadata = JSON.parse(fs.readFileSync(filename, 'utf8'));
  return path.resolve(path.dirname(filename), typeof metadata.bin === 'string' ? metadata.bin : metadata.bin[binary]);
}

async function run(packageName, binary, args) {
  const child = spawn(process.execPath, [executable(packageName, binary), ...args], {
    cwd: application, stdio: 'inherit', env: process.env,
  });
  const stop = () => child.kill();
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  try {
    return await new Promise((resolve, reject) => {
      child.once('error', reject);
      child.once('exit', code => resolve(code ?? 1));
    });
  } finally {
    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  }
}

prepareWorkspace();
let watcher;
if (command === 'dev') {
  watcher = watch([...sourceDirectories, ...sourceFiles()].map(name => path.join(root, name)), { ignoreInitial: true });
  watcher.on('add', filename => copySourceChange(filename)).on('change', filename => copySourceChange(filename))
    .on('unlink', filename => copySourceChange(filename, true));
}
try {
  let status = 0;
  if (command === 'check') status = await run('typescript', 'tsc', ['--noEmit', '-p', 'tsconfig.json']);
  if (!status && ['build', 'check'].includes(command)) {
    status = await run('vite', 'vite', ['build', '--config', 'scripts/vite.config.ts',
      '--outDir', path.join(root, 'dist'), ...arguments_]);
  } else if (command === 'dev') {
    status = await run('vite', 'vite', ['--config', 'scripts/vite.config.ts', ...arguments_]);
  } else if (command === 'preview') {
    status = await run('vite', 'vite', ['preview', '--config', 'scripts/vite.config.ts',
      '--outDir', path.join(root, 'dist'), ...arguments_]);
  } else if (command === 'test') {
    status = await run('vitest', 'vitest', ['run', '--config', 'scripts/vitest.config.ts', ...arguments_]);
  } else if (command === 'playwright') {
    status = await run('@playwright/test', 'playwright', ['test', ...arguments_]);
  }
  process.exitCode = status;
} finally {
  await watcher?.close();
  preserveBrowserResults();
}
