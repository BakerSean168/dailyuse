import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '..', '..', '..', '..');

export default async function globalSetup(): Promise<void> {
  const pnpmCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

  // Sync tests launch the packaged desktop main entrypoint directly.
  // Build it once up front so each spec can focus on auth/sync behavior.
  execFileSync(pnpmCommand, ['nx', 'build', 'desktop'], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: process.env,
  });
}
