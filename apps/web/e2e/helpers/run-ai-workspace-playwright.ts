import { spawn, type ChildProcess } from 'node:child_process';
import { delay } from '@memoflow/utils/frontend';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const webRoot = resolve(__dirname, '..', '..');
const workspaceRoot = resolve(webRoot, '..', '..');
const viteBinPath = resolve(workspaceRoot, 'node_modules/vite/bin/vite.js');
const playwrightCliPath = resolve(workspaceRoot, 'node_modules/playwright/cli.js');
const startApiServerPath = resolve(webRoot, 'e2e/helpers/start-api-server.ts');
const tsxCliPath = resolve(workspaceRoot, 'node_modules/tsx/dist/cli.mjs');
const webHost = process.env.AI_WORKSPACE_E2E_HOST ?? '127.0.0.1';
const webPort = Number(process.env.AI_WORKSPACE_E2E_PORT ?? '4174');
const webBaseUrl = `http://${webHost}:${webPort}`;
/** Residual 1337: goal-workflow still registers via real API; Vite-only boot left :3000 refused. */
const apiOrigin = process.env.E2E_API_BASE_URL ?? 'http://localhost:3000';
const apiUrl = new URL(apiOrigin);
const apiPort = apiUrl.port || (apiUrl.protocol === 'https:' ? '443' : '80');
const apiHealthUrl = `${apiOrigin.replace(/\/$/, '')}/healthz`;

/** Residual 1192: dual delay retired onto @memoflow/utils/frontend sole. */

async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        return;
      }
    } catch {
      // Retry until timeout while the dev server boots.
    }

    await delay(250);
  }

  throw new Error(`Timed out waiting for ${url} after ${timeoutMs}ms`);
}

function spawnChild(
  command: string,
  args: string[],
  options: {
    cwd: string;
    env?: NodeJS.ProcessEnv;
  },
): ChildProcess {
  return spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    stdio: 'inherit',
  });
}

async function killProcessTree(child: ChildProcess | undefined): Promise<void> {
  if (!child?.pid || child.exitCode !== null || child.killed) {
    return;
  }

  if (process.platform === 'win32') {
    await new Promise<void>((resolveKill) => {
      const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
      });
      killer.once('exit', () => resolveKill());
      killer.once('error', () => resolveKill());
    });
    return;
  }

  child.kill('SIGTERM');
  await delay(250);

  if (child.exitCode === null && !child.killed) {
    child.kill('SIGKILL');
  }
}

function waitForExit(child: ChildProcess, name: string): Promise<number> {
  return new Promise((resolveExit, rejectExit) => {
    child.once('error', (error) => {
      rejectExit(new Error(`${name} failed to start`, { cause: error }));
    });
    child.once('exit', (code, signal) => {
      if (signal) {
        rejectExit(new Error(`${name} exited with signal ${signal}`));
        return;
      }

      resolveExit(code ?? 0);
    });
  });
}

async function main(): Promise<void> {
  let apiServer: ChildProcess | undefined;
  let viteServer: ChildProcess | undefined;
  let playwrightProcess: ChildProcess | undefined;
  let exitCode = 0;

  const forwardShutdown = async () => {
    await killProcessTree(playwrightProcess);
    await killProcessTree(viteServer);
    await killProcessTree(apiServer);
  };

  const signalHandler = (signal: NodeJS.Signals) => {
    void forwardShutdown().finally(() => {
      process.kill(process.pid, signal);
    });
  };

  process.once('SIGINT', signalHandler);
  process.once('SIGTERM', signalHandler);

  try {
    // Residual 1337: register/login needs the e2e API (same as default web:e2e webServer).
    // CORS must allow the external Vite origin (4174), not only the default 5173 e2e web.
    const corsOrigins = [
      ...(process.env.CORS_ORIGIN ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
      webBaseUrl,
      'http://127.0.0.1:5173',
      'http://localhost:5173',
    ];
    apiServer = spawnChild(process.execPath, [tsxCliPath, startApiServerPath], {
      cwd: webRoot,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        RUNTIME_LANE: 'e2e',
        E2E_API_BASE_URL: apiOrigin,
        API_PORT: apiPort,
        CORS_ORIGIN: [...new Set(corsOrigins)].join(','),
      },
    });
    await waitForServer(apiHealthUrl, 300_000);

    viteServer = spawnChild(
      process.execPath,
      [viteBinPath, '--config', 'vite.config.ts', '--host', webHost, '--port', String(webPort)],
      {
        cwd: webRoot,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          PROXY_TARGET_URL: apiOrigin,
        },
      },
    );

    await waitForServer(`${webBaseUrl}/`, 30_000);

    playwrightProcess = spawnChild(
      process.execPath,
      [
        playwrightCliPath,
        'test',
        '--config',
        'playwright.ai-workspace.config.ts',
        ...process.argv.slice(2),
      ],
      {
        cwd: webRoot,
        env: {
          ...process.env,
          // Residual 1337: do not force CI=true (that enables retries and github reporter noise).
          PLAYWRIGHT_DISABLE_WEBSERVER: 'true',
          E2E_WEB_BASE_URL: webBaseUrl,
          E2E_API_BASE_URL: apiOrigin,
        },
      },
    );

    exitCode = await waitForExit(playwrightProcess, 'playwright');
  } finally {
    process.off('SIGINT', signalHandler);
    process.off('SIGTERM', signalHandler);
    await killProcessTree(playwrightProcess);
    await killProcessTree(viteServer);
    await killProcessTree(apiServer);
  }

  process.exit(exitCode);
}

void main().catch(async (error) => {
  console.error('[ai-workspace-playwright-runner] failed', error);
  process.exit(1);
});
