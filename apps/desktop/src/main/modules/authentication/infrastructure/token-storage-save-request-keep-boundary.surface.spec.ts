import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 897: TokenStorageData ≠ SaveTokenRequest intentional keep-boundary.
 * Persistence uses absolute *ExpiresAt timestamps; write request uses *ExpiresIn durations.
 * token-manager maps request → storage; not exact duals to collapse / type-alias.
 * Residual 895 (soft): refresh-result layered dual keep-boundary
 *   (application/refresh-result-layered-keep-boundary.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('token storage vs save-request keep-boundary (residual 897)', () => {
  const infraDir = __dirname;
  const tokenManager = readFileSync(resolve(infraDir, 'token-manager.ts'), 'utf8');
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

  it('keeps TokenStorageData as absolute-expiry persistence sole body', () => {
    expect(contractsAuth).toContain('Residual 897');
    expect(contractsAuth).toMatch(/export interface TokenStorageData\b/);
    const body = interfaceBody(contractsAuth, 'TokenStorageData');
    expect(body).toContain('accessToken: string');
    expect(body).toContain('refreshToken: string');
    expect(body).toContain('accessTokenExpiresAt: number');
    expect(body).toContain('refreshTokenExpiresAt: number');
    expect(body).toContain('identityId: IdentityId');
    expect(body).toContain('sessionId: string');
    // Not duration inputs
    expect(body).not.toMatch(/accessTokenExpiresIn\??\s*:/);
    expect(body).not.toMatch(/refreshTokenExpiresIn\??\s*:/);
    expect(contractsAuth).not.toContain(
      'export type TokenStorageData = SaveTokenRequest',
    );
  });

  it('keeps SaveTokenRequest as duration-input write sole body', () => {
    expect(contractsAuth).toContain('Residual 897');
    expect(contractsAuth).toMatch(/export interface SaveTokenRequest\b/);
    const body = interfaceBody(contractsAuth, 'SaveTokenRequest');
    expect(body).toContain('accessToken: string');
    expect(body).toContain('refreshToken: string');
    expect(body).toContain('accessTokenExpiresIn: number');
    expect(body).toContain('refreshTokenExpiresIn?: number');
    expect(body).toContain('identityId: IdentityId');
    expect(body).toContain('sessionId: string');
    // Not absolute timestamps
    expect(body).not.toMatch(/accessTokenExpiresAt\??\s*:/);
    expect(body).not.toMatch(/refreshTokenExpiresAt\??\s*:/);
    expect(contractsAuth).not.toContain(
      'export type SaveTokenRequest = TokenStorageData',
    );
  });

  it('token-manager maps SaveTokenRequest durations into TokenStorageData absolute expiries', () => {
    expect(tokenManager).toContain('Residual 897');
    expect(tokenManager).toContain('async saveTokens(request: SaveTokenRequest)');
    expect(tokenManager).toContain('const tokenData: TokenStorageData = {');
    expect(tokenManager).toContain(
      'accessTokenExpiresAt: now + request.accessTokenExpiresIn * 1000',
    );
    expect(tokenManager).toContain('request.refreshTokenExpiresIn');
    expect(tokenManager).toContain('refreshTokenExpiresAt:');
    // Must not collapse via type alias
    expect(tokenManager).not.toContain(
      'export type TokenStorageData = SaveTokenRequest',
    );
    expect(tokenManager).not.toContain(
      'export type SaveTokenRequest = TokenStorageData',
    );
  });
});
