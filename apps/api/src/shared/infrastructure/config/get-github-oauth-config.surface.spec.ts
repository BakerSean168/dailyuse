/**
 * Residual 1333: e2e lane identity OAuth stays on e2e-mock even when real
 * GITHUB_OAUTH_* credentials are loaded from gitignored .env.test.local for
 * App / live-github wiring. Knowledge-repo App config is a separate path.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('getGithubOAuthConfig e2e-mock keep-boundary (residual 1333)', () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('forces e2e-mock on RUNTIME_LANE=e2e even when real OAuth client id is set', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('RUNTIME_LANE', 'e2e');
    vi.stubEnv('GITHUB_OAUTH_CLIENT_ID', 'Iv23li-real-client-id');
    vi.stubEnv('GITHUB_OAUTH_CLIENT_SECRET', 'real-client-secret');
    vi.stubEnv('JWT_SECRET', 'test-jwt-secret-not-for-production-min-32');
    vi.stubEnv('DATABASE_URL', 'postgresql://test_user:test_pass@127.0.0.1:5433/memoflow_test');

    const { getGithubOAuthConfig } = await import('./env.js');
    const config = getGithubOAuthConfig();
    expect(config).toEqual({
      clientId: 'e2e-mock',
      clientSecret: 'e2e-mock-secret',
    });
  });

  it('does not force e2e-mock outside RUNTIME_LANE=e2e when real OAuth is configured', async () => {
    // Leave NODE_ENV as test so schema loads, but set a non-e2e runtime lane.
    // dotenv may still inject gitignored local client ids; assert only that we
    // do not replace them with the e2e mock when lane is not e2e.
    vi.stubEnv('NODE_ENV', 'test');
    vi.stubEnv('RUNTIME_LANE', 'host-dev');
    vi.stubEnv('GITHUB_OAUTH_CLIENT_ID', 'Iv23li-real-client-id');
    vi.stubEnv('GITHUB_OAUTH_CLIENT_SECRET', 'real-client-secret');
    vi.stubEnv('JWT_SECRET', 'test-jwt-secret-not-for-production-min-32');
    vi.stubEnv('DATABASE_URL', 'postgresql://test_user:test_pass@127.0.0.1:5433/memoflow_test');

    const { getGithubOAuthConfig } = await import('./env.js');
    const config = getGithubOAuthConfig();
    expect(config).not.toBeNull();
    expect(config?.clientId).not.toBe('e2e-mock');
    expect(config?.clientId).toBeTruthy();
    expect(config?.clientSecret).toBeTruthy();
  });
});
