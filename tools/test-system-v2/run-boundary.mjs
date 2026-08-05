#!/usr/bin/env node
import { spawn } from 'node:child_process';

const suites = [
  ['ipc', ['exec', 'nx', 'run', 'desktop:test:ipc']],
  ['main', ['exec', 'nx', 'run', 'desktop:test:main']],
];
const results = [];
for (const [name, args] of suites) {
  const started = Date.now();
  const exitCode = await new Promise((resolve) => {
    const child = spawn('pnpm', args, { stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('close', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
    child.on('error', () => resolve(1));
  });
  results.push({ name, exitCode, durationMs: Date.now() - started });
}
console.log(JSON.stringify({ suites: results }, null, 2));
if (results.some((result) => result.exitCode !== 0)) process.exitCode = 1;
