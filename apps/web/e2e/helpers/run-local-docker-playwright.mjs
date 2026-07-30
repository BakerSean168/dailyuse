import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLocalComposeRuntimeEnv } from '../../../../tools/docker/local-compose.mjs';

const currentDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(currentDir, '../../../..');
const webRoot = resolve(workspaceRoot, 'apps/web');

process.chdir(workspaceRoot);
const env = createLocalComposeRuntimeEnv({ quiet: true });
env.E2E_WEB_BASE_URL = `http://127.0.0.1:${env.WEB_HOST_PORT}`;
env.E2E_API_BASE_URL = `http://127.0.0.1:${env.API_HOST_PORT}`;
env.E2E_API_FULL_URL = `${env.E2E_API_BASE_URL}/api/v1`;

const playwrightCli = resolve(workspaceRoot, 'node_modules/@playwright/test/cli.js');
const result = spawnSync(
  process.execPath,
  [
    playwrightCli,
    'test',
    '--config',
    'playwright.local-docker.config.ts',
    ...process.argv.slice(2),
  ],
  {
    cwd: webRoot,
    env,
    stdio: 'inherit',
  },
);

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
