import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureTestDatabase } from '@dailyuse/test-utils/setup/database';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..', '..', '..', '..');
const apiDistDir = path.resolve(workspaceRoot, 'apps', 'api', 'dist');

async function main(): Promise<void> {
  await ensureTestDatabase(workspaceRoot);

  const apiProcess = spawn(process.execPath, ['main.js'], {
    cwd: apiDistDir,
    env: process.env,
    stdio: 'inherit',
  });

  const forwardSignal = (signal: NodeJS.Signals) => {
    if (!apiProcess.killed) {
      apiProcess.kill(signal);
    }
  };

  process.on('SIGINT', () => forwardSignal('SIGINT'));
  process.on('SIGTERM', () => forwardSignal('SIGTERM'));

  apiProcess.once('error', (error) => {
    console.error('[playwright-api-server] failed to start API process', error);
    process.exit(1);
  });

  apiProcess.once('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

void main().catch((error) => {
  console.error('[playwright-api-server] setup failed', error);
  process.exit(1);
});
