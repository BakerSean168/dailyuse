#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const nxCli = path.join(workspaceRoot, 'node_modules/nx/dist/bin/nx.js');

const suites = [
  ['ipc', ['run', 'desktop:test:ipc']],
  ['main', ['run', 'desktop:test:main']],
];
const results = [];
for (const [name, args] of suites) {
  const started = Date.now();
  const exitCode = await new Promise((resolve) => {
    const child = spawn(process.execPath, [nxCli, ...args], {
      cwd: workspaceRoot,
      stdio: 'inherit',
    });
    child.on('close', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
    child.on('error', () => resolve(1));
  });
  results.push({ name, exitCode, durationMs: Date.now() - started });
}
console.log(JSON.stringify({ suites: results }, null, 2));
if (results.some((result) => result.exitCode !== 0)) process.exitCode = 1;
