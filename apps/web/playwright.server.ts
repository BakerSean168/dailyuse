import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const WORKSPACE_ROOT = resolve(__dirname, '../..');
const VITE_BIN_PATH = resolve(WORKSPACE_ROOT, 'node_modules/vite/bin/vite.js');
const DEFAULT_API_ORIGIN = 'http://localhost:3000';
const DEFAULT_WEB_ORIGIN = 'http://127.0.0.1:5173';
const LEGACY_LOCALHOST_WEB_ORIGIN = 'http://localhost:5173';

function quoteShellArgument(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function loadEnvFile(filePath: string): void {
  if (existsSync(filePath)) {
    expand(config({ path: filePath, override: true }));
  }
}

export function loadE2EEnv(): void {
  const preservedEntries = new Map<string, string>();
  for (const [key, value] of Object.entries(process.env)) {
    if (typeof value === 'string') {
      preservedEntries.set(key, value);
    }
  }

  process.env.NODE_ENV = 'test';

  const envFiles = [
    resolve(WORKSPACE_ROOT, '.env'),
    resolve(WORKSPACE_ROOT, '.env.test'),
    resolve(WORKSPACE_ROOT, '.env.local'),
    resolve(WORKSPACE_ROOT, '.env.test.local'),
  ];

  for (const filePath of envFiles) {
    loadEnvFile(filePath);
  }

  for (const [key, value] of preservedEntries) {
    process.env[key] = value;
  }

  process.env.NODE_ENV = 'test';
}

loadE2EEnv();

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, '');
}

function getApiOrigin(): string {
  const apiOrigin = normalizeOrigin(process.env.E2E_API_BASE_URL ?? DEFAULT_API_ORIGIN);

  process.env.E2E_API_BASE_URL ??= apiOrigin;
  process.env.E2E_API_FULL_URL ??= `${apiOrigin}/api/v1`;

  return apiOrigin;
}

function getWebOrigin(): string {
  return normalizeOrigin(process.env.E2E_WEB_BASE_URL ?? DEFAULT_WEB_ORIGIN);
}

function getWebServerRuntimeConfig() {
  const webOrigin = getWebOrigin();
  const webUrl = new URL(webOrigin);

  return {
    origin: webOrigin,
    host: webUrl.hostname,
    port: webUrl.port || '80',
  };
}

function getCorsOrigins(): string {
  const configuredOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([getWebOrigin(), LEGACY_LOCALHOST_WEB_ORIGIN, ...configuredOrigins])].join(',');
}

/**
 * API must not silently reuse Docker/host-dev on :3000.
 * Opt in only with E2E_REUSE_SERVERS=1 (and never on CI).
 * Web may still reuse an existing Vite server locally.
 */
function shouldReuseApiServer(): boolean {
  if (process.env.CI) {
    return false;
  }
  return process.env.E2E_REUSE_SERVERS === '1';
}

function shouldReuseWebServer(): boolean {
  if (process.env.CI) {
    return false;
  }
  if (process.env.E2E_REUSE_SERVERS === '0') {
    return false;
  }
  return true;
}

const apiServerOptions = {
  reuseExistingServer: shouldReuseApiServer(),
  timeout: 300 * 1000,
} as const;

const webServerOptions = {
  reuseExistingServer: shouldReuseWebServer(),
  timeout: 300 * 1000,
} as const;

export function createApiServer() {
  const apiOrigin = getApiOrigin();

  return {
    // Ensure the local test database is ready before booting the built API entrypoint.
    // Probe + RUNTIME_LANE=e2e happen inside start-api-server.ts so wrong owners fail loudly.
    command: 'pnpm exec tsx ./e2e/helpers/start-api-server.ts',
    cwd: '.',
    url: `${apiOrigin}/healthz`,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      RUNTIME_LANE: 'e2e',
      CORS_ORIGIN: getCorsOrigins(),
    },
    ...apiServerOptions,
  };
}

export function createWebServer(url = `${getWebOrigin()}/auth`) {
  const apiOrigin = getApiOrigin();
  const webServer = getWebServerRuntimeConfig();

  return {
    // Call the Vite entrypoint through the current Node binary so Playwright can
    // tear the dev server down cleanly on Windows without leaving a pnpm/cmd tree behind.
    command: `${quoteShellArgument(process.execPath)} ${quoteShellArgument(VITE_BIN_PATH)} --config vite.config.ts --host ${webServer.host} --port ${webServer.port}`,
    cwd: '.',
    url,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PROXY_TARGET_URL: apiOrigin,
    },
    ...webServerOptions,
  };
}

export { DEFAULT_API_ORIGIN as defaultApiOrigin };
