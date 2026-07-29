import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ensureTestDatabase } from '@memoflow/test-utils/setup/database';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..', '..', '..', '..');

async function main(): Promise<void> {
  // Apply the compose definition first. This recreates an older test Postgres
  // automatically when it still uses wal_level=replica.
  execFileSync('docker', ['compose', '--profile', 'test', 'up', '-d', '--wait', 'postgres-test'], {
    cwd: workspaceRoot,
    stdio: 'inherit',
  });

  await ensureTestDatabase(workspaceRoot);

  execFileSync(
    'docker',
    [
      'compose',
      '--profile',
      'test',
      '--profile',
      'sync-test',
      'up',
      '-d',
      '--wait',
      'powersync-test',
    ],
    { cwd: workspaceRoot, stdio: 'inherit' },
  );

  console.log('[playwright-powersync] isolated test service is ready');

  // Playwright owns this sentinel process and polls the actual PowerSync URL.
  // Keep it alive so webServer lifecycle handling remains deterministic.
  await new Promise<void>((resolve) => {
    process.once('SIGINT', resolve);
    process.once('SIGTERM', resolve);
  });
}

void main().catch((error) => {
  console.error('[playwright-powersync] setup failed', error);
  process.exit(1);
});
