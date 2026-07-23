import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 917: AuthFlowResult named duals retired.
 * DesktopLoginResult / RegisterResult / DesktopRefreshResult collapsed to sole
 * DesktopAuthFlowResult in auth-flow-types (application AuthFlowResult<AuthResponseDTO>).
 * Residual 895 (soft): layered keep-boundary vs TokenRefreshResult / RefreshSessionResponse
 *   (refresh-result-layered-keep-boundary.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('auth-flow-result named duals retired (residual 917)', () => {
  const appDir = __dirname;
  const authFlow = readFileSync(resolve(appDir, 'auth-flow-types.ts'), 'utf8');
  const login = readFileSync(resolve(appDir, 'login-desktop-account.ts'), 'utf8');
  const register = readFileSync(resolve(appDir, 'register-desktop-account.ts'), 'utf8');
  const refresh = readFileSync(resolve(appDir, 'refresh-desktop-session.ts'), 'utf8');

  it('owns DesktopAuthFlowResult sole alias in auth-flow-types', () => {
    expect(authFlow).toContain('Residual 917');
    expect(authFlow).toContain(
      'export type DesktopAuthFlowResult = AuthFlowResult<AuthResponseDTO>',
    );
    expect(authFlow).toContain(
      'export type AuthFlowResult<T> = { ok: true; response: T } | { ok: false; error: AuthFlowError }',
    );
    expect(authFlow).not.toMatch(/export type DesktopLoginResult\b/);
    expect(authFlow).not.toMatch(/export type RegisterResult\b/);
    expect(authFlow).not.toMatch(/export type DesktopRefreshResult\b/);
  });

  it('login/register/refresh return DesktopAuthFlowResult without local dual aliases', () => {
    expect(login).toContain('Residual 917');
    expect(login).toContain('type DesktopAuthFlowResult');
    expect(login).toContain('Promise<DesktopAuthFlowResult>');
    expect(login).not.toMatch(/export type DesktopLoginResult\b/);

    expect(register).toContain('Residual 917');
    expect(register).toContain('type DesktopAuthFlowResult');
    expect(register).toContain('Promise<DesktopAuthFlowResult>');
    expect(register).not.toMatch(/export type RegisterResult\b/);

    expect(refresh).toContain('Residual 917');
    expect(refresh).toContain('type DesktopAuthFlowResult');
    expect(refresh).toContain('Promise<DesktopAuthFlowResult>');
    expect(refresh).not.toMatch(/export type DesktopRefreshResult\b/);
  });

  it('keeps residual 895 layered keep-boundary comment on refresh application flow', () => {
    expect(refresh).toContain('Residual 895');
    expect(refresh).toContain('TokenRefreshResult');
    expect(refresh).toContain('RefreshSessionResponse');
    expect(authFlow).toContain('residual 895');
    expect(authFlow).toContain('TokenRefreshResult');
    expect(authFlow).toContain('RefreshSessionResponse');
  });
});
