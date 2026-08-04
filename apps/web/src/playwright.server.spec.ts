import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const workspaceRoot = resolve(__dirname, '../../..');

function resetEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }

  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

afterEach(() => {
  resetEnv();
  vi.resetModules();
});

describe('playwright.server', () => {
  it('loads test env values into child processes', async () => {
    delete process.env.DATABASE_URL;
    delete process.env.DB_HOST;
    delete process.env.NODE_ENV;

    const { createApiServer, createWebServer } = await import('../playwright.server');

    const apiServer = createApiServer();
    const webServer = createWebServer();

    expect(process.env.NODE_ENV).toBe('test');
    expect(apiServer.env?.NODE_ENV).toBe('test');
    expect(apiServer.env?.LOCAL_VALIDATION).toBe('1');
    expect(webServer.env?.NODE_ENV).toBe('test');
    expect(apiServer.env?.DATABASE_URL).toBe(
      'postgresql://test_user:test_pass@127.0.0.1:5433/memoflow_test',
    );
    expect(webServer.env?.DATABASE_URL).toBe(
      'postgresql://test_user:test_pass@127.0.0.1:5433/memoflow_test',
    );
  });

  it('injects the default web origin into API CORS config', async () => {
    delete process.env.E2E_API_BASE_URL;
    delete process.env.E2E_WEB_BASE_URL;
    delete process.env.E2E_API_FULL_URL;
    delete process.env.CORS_ORIGIN;

    const { createApiServer } = await import('../playwright.server');

    const server = createApiServer();

    expect(server.url).toBe('http://localhost:3000/healthz');
    expect(server.env?.CORS_ORIGIN).toBe('http://127.0.0.1:5173,http://localhost:5173');
    expect(process.env.E2E_API_BASE_URL).toBe('http://localhost:3000');
    expect(process.env.E2E_API_FULL_URL).toBe('http://localhost:3000/api/v1');
  });

  it('uses overridden E2E origins for both API and web servers', async () => {
    process.env.E2E_API_BASE_URL = 'http://127.0.0.1:3001/';
    process.env.E2E_WEB_BASE_URL = 'http://localhost:4173/';
    delete process.env.E2E_API_FULL_URL;
    delete process.env.CORS_ORIGIN;

    const { createApiServer, createWebServer, getE2EWebOrigin } = await import(
      '../playwright.server'
    );

    const apiServer = createApiServer();
    const webServer = createWebServer();

    expect(apiServer.url).toBe('http://127.0.0.1:3001/healthz');
    expect(apiServer.env?.CORS_ORIGIN).toBe(
      'http://localhost:4173,http://localhost:5173,http://127.0.0.1:5173',
    );
    expect(webServer.url).toBe('http://localhost:4173/auth');
    expect(getE2EWebOrigin()).toBe('http://localhost:4173');
    expect(webServer.command).toBe(
      `"${process.execPath}" "${resolve(workspaceRoot, 'node_modules/vite/bin/vite.js')}" --config vite.config.ts --host localhost --port 4173`,
    );
    expect(webServer.env?.PROXY_TARGET_URL).toBe('http://127.0.0.1:3001');
    expect(process.env.E2E_API_FULL_URL).toBe('http://127.0.0.1:3001/api/v1');
  });

  it('preserves existing CORS origins while appending E2E web origins', async () => {
    process.env.E2E_WEB_BASE_URL = 'http://127.0.0.1:5173';
    process.env.CORS_ORIGIN = 'https://app.example.com,http://localhost:5173';

    const { createApiServer } = await import('../playwright.server');

    const apiServer = createApiServer();

    expect(apiServer.env?.CORS_ORIGIN).toBe(
      'http://127.0.0.1:5173,http://localhost:5173,https://app.example.com',
    );
  });

  it('starts fresh API and web servers by default', async () => {
    delete process.env.CI;
    delete process.env.E2E_REUSE_SERVERS;

    const { createApiServer, createWebServer } = await import('../playwright.server');

    expect(createApiServer().reuseExistingServer).toBe(false);
    expect(createWebServer().reuseExistingServer).toBe(false);
  });

  it('reuses API and web servers only after an explicit local opt-in', async () => {
    delete process.env.CI;
    process.env.E2E_REUSE_SERVERS = '1';

    const { createApiServer, createWebServer } = await import('../playwright.server');

    expect(createApiServer().reuseExistingServer).toBe(true);
    expect(createWebServer().reuseExistingServer).toBe(true);
  });

  it('never reuses API or web servers on CI', async () => {
    process.env.CI = '1';
    process.env.E2E_REUSE_SERVERS = '1';

    const { createApiServer, createWebServer } = await import('../playwright.server');

    expect(createApiServer().reuseExistingServer).toBe(false);
    expect(createWebServer().reuseExistingServer).toBe(false);
  });

  it('real OAuth API server uses host-dev lane (residual 1339, not e2e-mock)', async () => {
    process.env.GITHUB_OAUTH_CLIENT_ID = 'Ov23test-real-client';
    process.env.GITHUB_OAUTH_CLIENT_SECRET = 'real-secret-for-test-only';

    const { createApiServer, createRealOAuthApiServer } = await import('../playwright.server');

    const mockLane = createApiServer();
    expect(mockLane.env?.RUNTIME_LANE).toBe('e2e');

    const realLane = createRealOAuthApiServer();
    expect(realLane.env?.RUNTIME_LANE).toBe('host-dev');
    expect(realLane.env?.E2E_REAL_GITHUB_OAUTH).toBe('1');
    expect(realLane.env?.GITHUB_OAUTH_CLIENT_ID).toBe('Ov23test-real-client');
    expect(realLane.env?.GITHUB_OAUTH_CLIENT_SECRET).toBe('real-secret-for-test-only');
  });
});
