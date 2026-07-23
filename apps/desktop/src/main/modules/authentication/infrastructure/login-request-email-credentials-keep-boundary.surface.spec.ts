import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 899: LoginRequest ≠ EmailLoginCredentials intentional keep-boundary.
 * Offline/local uses identifier; online email login uses email.
 * Residual 869/921 (soft): DesktopLoginRequest name dual fully retired —
 *   online login uses EmailLoginCredentials sole body
 *   (application/desktop-login-request-dual.surface.spec.ts).
 * Residual 897 (soft): TokenStorageData ≠ SaveTokenRequest keep-boundary
 *   (token-storage-save-request-keep-boundary.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('login request vs email credentials keep-boundary (residual 899)', () => {
  const infraDir = __dirname;
  const loginOrchestrator = readFileSync(resolve(infraDir, 'login-orchestrator.ts'), 'utf8');
  const sessionManager = readFileSync(resolve(infraDir, 'session-manager.ts'), 'utf8');
  const loginDesktop = readFileSync(
    resolve(infraDir, '../application/login-desktop-account.ts'),
    'utf8',
  );
  const contractsAuth = readFileSync(
    resolve(
      infraDir,
      '../../../../../../../packages/contracts/src/modules/authentication/protocol/desktop-auth.types.ts',
    ),
    'utf8',
  );

  function interfaceBody(source: string, name: string): string {
    const start = source.indexOf(`export interface ${name}`);
    expect(start).toBeGreaterThanOrEqual(0);
    const brace = source.indexOf('{', start);
    const end = source.indexOf('\n}', brace);
    return source.slice(brace, end + 2);
  }

  it('keeps LoginRequest as offline/local identifier sole body', () => {
    expect(contractsAuth).toContain('Residual 899');
    expect(contractsAuth).toMatch(/export interface LoginRequest\b/);
    const body = interfaceBody(contractsAuth, 'LoginRequest');
    expect(body).toContain('identifier: string');
    expect(body).toContain('password: string');
    expect(body).toContain('rememberPassword?: boolean');
    expect(body).toContain('autoLogin?: boolean');
    expect(body).not.toMatch(/^\s*email\??\s*:/m);
    expect(contractsAuth).not.toContain(
      'export type LoginRequest = EmailLoginCredentials',
    );
  });

  it('keeps EmailLoginCredentials as online email sole body (no DesktopLoginRequest name dual)', () => {
    expect(contractsAuth).toContain('Residual 899');
    expect(contractsAuth).toMatch(/export interface EmailLoginCredentials\b/);
    const body = interfaceBody(contractsAuth, 'EmailLoginCredentials');
    expect(body).toContain('email: string');
    expect(body).toContain('password: string');
    expect(body).toContain('rememberPassword?: boolean');
    expect(body).toContain('autoLogin?: boolean');
    expect(body).not.toMatch(/^\s*identifier\??\s*:/m);
    expect(contractsAuth).not.toContain(
      'export type EmailLoginCredentials = LoginRequest',
    );
    expect(loginDesktop).toContain('Residual 921');
    expect(loginDesktop).toContain('request: EmailLoginCredentials');
    expect(loginDesktop).not.toMatch(/export type DesktopLoginRequest\b/);
    expect(loginDesktop).not.toMatch(/export interface DesktopLoginRequest\b/);
  });

  it('infra offline path uses LoginRequest; application online path uses EmailLoginCredentials', () => {
    expect(loginOrchestrator).toContain('async loginOffline(request: LoginRequest)');
    expect(sessionManager).toContain('async loginOffline(request: LoginRequest)');
    expect(loginDesktop).toContain('request: EmailLoginCredentials');
    expect(loginDesktop).toContain(
      'onSuccess?: (response: AuthResponseDTO, request: EmailLoginCredentials)',
    );
    // Must not collapse offline identifier shape into email credentials
    expect(loginOrchestrator).not.toContain(
      'export type LoginRequest = EmailLoginCredentials',
    );
    expect(loginDesktop).not.toContain(
      'export type DesktopLoginRequest = LoginRequest',
    );
    expect(loginDesktop).not.toContain(
      'export type DesktopLoginRequest = EmailLoginCredentials',
    );
  });
});
