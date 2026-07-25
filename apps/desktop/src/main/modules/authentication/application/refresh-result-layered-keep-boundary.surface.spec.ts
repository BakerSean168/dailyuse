import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 895: refresh-result intentional layered dual keep-boundary.
 * TokenRefreshResult (token-manager callback) ≠ RefreshSessionResponse (infra session refresh)
 * ≠ DesktopAuthFlowResult (application online AuthFlowResult<AuthResponseDTO>).
 * Not exact duals to collapse; keep separate bodies / aliases.
 * Residual 917 (soft): DesktopLoginResult/RegisterResult/DesktopRefreshResult duals retired
 *   (auth-flow-result-named-dual.surface.spec.ts) — sole application name DesktopAuthFlowResult.
 * Residual 893 (soft): OAuthProvider transport≠domain keep-boundary
 *   (packages/contracts .../oauth-provider-transport-domain-keep-boundary.surface.spec.ts).
 * Residual 897 (soft): TokenStorageData ≠ SaveTokenRequest keep-boundary
 *   (infrastructure/token-storage-save-request-keep-boundary.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('refresh-result layered dual keep-boundary (residual 895)', () => {
  const appDir = __dirname;
  const refreshDesktop = readFileSync(resolve(appDir, 'refresh-desktop-session.ts'), 'utf8');
  const authFlow = readFileSync(resolve(appDir, 'auth-flow-types.ts'), 'utf8');
  const contractsAuth = readFileSync(
    resolve(
      appDir,
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

  it('keeps TokenRefreshResult as token-manager callback sole body', () => {
    expect(contractsAuth).toContain('Residual 895');
    expect(contractsAuth).toMatch(/export interface TokenRefreshResult\b/);
    const body = interfaceBody(contractsAuth, 'TokenRefreshResult');
    expect(body).toContain('ok: boolean');
    expect(body).toContain('accessToken?: string');
    expect(body).toContain('expiresAt?: number');
    expect(body).toContain('error?: string');
    expect(body).not.toMatch(/refreshToken\??\s*:/);
    expect(body).not.toMatch(/expiresIn\??\s*:/);
    expect(body).not.toMatch(/response\??\s*:/);
    expect(contractsAuth).not.toContain(
      'export type TokenRefreshResult = RefreshSessionResponse',
    );
    expect(contractsAuth).not.toContain(
      'export type TokenRefreshResult = DesktopAuthFlowResult',
    );
  });

  it('keeps RefreshSessionResponse as infrastructure session refresh sole body', () => {
    expect(contractsAuth).toContain('Residual 895');
    expect(contractsAuth).toMatch(/export interface RefreshSessionResponse\b/);
    const body = interfaceBody(contractsAuth, 'RefreshSessionResponse');
    expect(body).toContain('ok: boolean');
    expect(body).toContain('accessToken?: string');
    expect(body).toContain('refreshToken?: string');
    expect(body).toContain('expiresIn?: number');
    expect(body).toContain('error?: string');
    expect(body).not.toMatch(/expiresAt\??\s*:/);
    expect(body).not.toMatch(/response\??\s*:/);
    expect(contractsAuth).not.toContain(
      'export type RefreshSessionResponse = TokenRefreshResult',
    );
    expect(contractsAuth).not.toContain(
      'export type RefreshSessionResponse = DesktopAuthFlowResult',
    );
  });

  it('keeps DesktopAuthFlowResult as application AuthFlowResult of AuthResponseDTO', () => {
    expect(refreshDesktop).toContain('Residual 895');
    expect(refreshDesktop).toContain('Residual 917');
    expect(refreshDesktop).toContain(
      "import {",
    );
    expect(refreshDesktop).toContain('type DesktopAuthFlowResult');
    expect(refreshDesktop).toContain('Promise<DesktopAuthFlowResult>');
    expect(refreshDesktop).not.toMatch(/export type DesktopRefreshResult\b/);
    expect(refreshDesktop).not.toMatch(/export interface DesktopRefreshResult\b/);
    expect(authFlow).toContain('Residual 917');
    expect(authFlow).toContain(
      'export type DesktopAuthFlowResult = AuthFlowResult<AuthResponseDTO>',
    );
    expect(authFlow).toContain(
      'export type AuthFlowResult<T> = { ok: true; response: T } | { ok: false; error: AuthFlowError }',
    );
    expect(refreshDesktop).toContain('export async function refreshDesktopSession');
  });
});
