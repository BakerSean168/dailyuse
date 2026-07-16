import { execFileSync, execSync } from 'node:child_process';

export function buildApiApp(workspaceRoot: string): void {
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
