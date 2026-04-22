import { execFileSync, execSync } from 'node:child_process';

export function buildDesktopApp(workspaceRoot: string): void {
  // Windows 下直接 execFileSync('pnpm.cmd', ...) 会触发 EINVAL。
  // 改为 shell 形式执行，保持和终端里的 `pnpm nx build desktop` 一致。
  if (process.platform === 'win32') {
    execSync('pnpm nx build desktop', {
      cwd: workspaceRoot,
      stdio: 'inherit',
      env: process.env,
      shell: true,
    });
    return;
  }

  execFileSync('pnpm', ['nx', 'build', 'desktop'], {
    cwd: workspaceRoot,
    stdio: 'inherit',
    env: process.env,
  });
}
