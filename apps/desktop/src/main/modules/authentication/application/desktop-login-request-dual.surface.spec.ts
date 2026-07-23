import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 869: DesktopLoginRequest dual retired (type alias of EmailLoginCredentials).
 * Residual 921: DesktopLoginRequest name fully retired — login uses EmailLoginCredentials sole body.
 * Soft residual 871/931: RegisterRequest name dual fully retired — EmailRegisterCredentials
 *   (desktop-register-request-dual.surface.spec.ts).
 * Residual 899 (soft): LoginRequest ≠ EmailLoginCredentials keep-boundary
 *   (infrastructure/login-request-email-credentials-keep-boundary.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('desktop DesktopLoginRequest dual retired (residual 869/921)', () => {
  const appDir = __dirname;
  const login = readFileSync(resolve(appDir, 'login-desktop-account.ts'), 'utf8');
  const contractsAuth = readFileSync(
    resolve(
      appDir,
      '../../../../../../../packages/contracts/src/modules/authentication/protocol/desktop-auth.types.ts',
    ),
    'utf8',
  );

  it('drops DesktopLoginRequest name and uses EmailLoginCredentials sole body', () => {
    expect(login).toContain('Residual 869');
    expect(login).toContain('Residual 921');
    expect(login).toContain('type EmailLoginCredentials');
    expect(login).toContain('request: EmailLoginCredentials');
    expect(login).not.toMatch(/export type DesktopLoginRequest\b/);
    expect(login).not.toMatch(/export interface DesktopLoginRequest\b/);
    expect(login).not.toMatch(/request: DesktopLoginRequest\b/);
  });

  it('keeps sole EmailLoginCredentials interface body in contracts', () => {
    expect(contractsAuth).toContain('Residual 869');
    expect(contractsAuth).toMatch(/export interface EmailLoginCredentials\b/);
    expect(contractsAuth).not.toMatch(/export interface DesktopLoginRequest\b/);
  });

  it('loginDesktopAccount still exports async login entrypoint', () => {
    expect(login).toContain('export async function loginDesktopAccount');
    expect(login).toContain(
      'onSuccess?: (response: AuthResponseDTO, request: EmailLoginCredentials)',
    );
  });
});
