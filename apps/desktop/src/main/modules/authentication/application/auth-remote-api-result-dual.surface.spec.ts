import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 933: LoginApiResult / RefreshApiResult / RegisterApiResult duals retired.
 * Sole envelope: AuthRemoteApiResult<T> (ok + status + data).
 * Soft residual 931: RegisterRequest→EmailRegisterCredentials
 *   (desktop-register-request-dual.surface.spec.ts).
 * Soft residual 917: DesktopAuthFlowResult named dual retired
 *   (auth-flow-result-named-dual.surface.spec.ts).
 * Keep-boundary: RegisterApiResponse remains loose register payload (≠ strict AuthResponseDTO).
 * Residual 939 (soft): readErrorPayload uses AuthRemoteErrorData sole return
 *   (to-error-log-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('desktop AuthRemoteApiResult dual retired (residual 933)', () => {
  const appDir = __dirname;
  const gateway = readFileSync(resolve(appDir, 'auth-remote-gateway.ts'), 'utf8');

  it('owns AuthRemoteApiResult sole envelope and drops named dual result types', () => {
    expect(gateway).toContain('Residual 933');
    expect(gateway).toContain('export type AuthRemoteApiResult<T>');
    expect(gateway).toContain('ok: boolean');
    expect(gateway).toContain('status: number');
    expect(gateway).toContain('data: T');
    expect(gateway).not.toMatch(/export interface RegisterApiResult\b/);
    expect(gateway).not.toMatch(/export interface LoginApiResult\b/);
    expect(gateway).not.toMatch(/export interface RefreshApiResult\b/);
    expect(gateway).not.toMatch(/export type RegisterApiResult\b/);
    expect(gateway).not.toMatch(/export type LoginApiResult\b/);
    expect(gateway).not.toMatch(/export type RefreshApiResult\b/);
  });

  it('register/login/refresh return AuthRemoteApiResult parameterized envelopes', () => {
    expect(gateway).toContain(
      '): Promise<AuthRemoteApiResult<RegisterApiResponse>>',
    );
    expect(gateway).toContain(
      '): Promise<AuthRemoteApiResult<AuthResponseDTO | AuthRemoteErrorData>>',
    );
    // both login and refresh share the AuthResponseDTO | AuthRemoteErrorData param
    expect(gateway).toContain('async login(');
    expect(gateway).toContain('async refreshToken(');
    expect(
      gateway.split(
        'Promise<AuthRemoteApiResult<AuthResponseDTO | AuthRemoteErrorData>>',
      ).length - 1,
    ).toBe(2);
  });

  it('keeps RegisterApiResponse loose payload keep-boundary (not forced AuthResponseDTO merge)', () => {
    expect(gateway).toMatch(/export interface RegisterApiResponse\b/);
    expect(gateway).toContain('extends Partial<AuthResponseDTO>');
    expect(gateway).toContain('identityId?: string');
    expect(gateway).toContain('sessionId?: string');
    expect(gateway).toContain('message?: string');
    expect(gateway).not.toContain(
      'export type RegisterApiResponse = AuthResponseDTO',
    );
  });
});
