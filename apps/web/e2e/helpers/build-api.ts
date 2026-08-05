import { execFileSync, execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export function buildApiApp(workspaceRoot: string): void {
  if (
    process.env.E2E_PREBUILT_ARTIFACT === '1' &&
    existsSync(join(workspaceRoot, 'apps', 'api', 'dist', 'main.js'))
  ) {
    console.log('[playwright-api-server] using verified API build artifact');
    return;
  }
  if (process.platform === 'win32') {
    execSync('pnpm nx build api', {
      cwd: workspaceRoot,
      stdio: 'inherit',
      env: process.env,
      shell: true,
    });
    return;
  }

  execFileSync('pnpm', ['nx', 'build', 'api'], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: process.env,
  });
}
