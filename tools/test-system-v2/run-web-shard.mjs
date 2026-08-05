#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const shardNumber = Number.parseInt(process.argv[2], 10);
const manifest = JSON.parse(await readFile('tools/test-system-v2/web-shards.json', 'utf8'));
const shard = manifest.shards.find((entry) => entry.shard === shardNumber);
if (!shard) throw new Error(`Unknown Web Flow shard: ${process.argv[2]}`);
const args = ['exec', 'playwright', 'test', ...shard.specs.map((spec) => `e2e/${spec}`)];
const exitCode = await new Promise((resolve) => {
  const child = spawn('pnpm', args, {
    cwd: 'apps/web',
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  child.on('close', (code) => resolve(code ?? 1));
  child.on('error', () => resolve(1));
});
process.exitCode = exitCode;
