import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 871: RegisterRequest dual retired (sole body was register-desktop-account).
 * Residual 931: RegisterRequest name fully retired — EmailRegisterCredentials sole body in contracts.
 * Soft residual 875: RegistrationRequestPayload dual retired in
 *   desktop-registration-request-payload-dual.surface.spec.ts.
 * Does not flip §13.2 checkboxes.
 */
describe('desktop RegisterRequest dual retired (residual 871/931)', () => {
  const appDir = __dirname;
  const register = readFileSync(resolve(appDir, 'register-desktop-account.ts'), 'utf8');
  const coordinator = readFileSync(
    resolve(appDir, 'desktop-credential-auth-coordinator.ts'),
    'utf8',
  );
  const contractsAuth = readFileSync(
    resolve(
      appDir,
      '../../../../../../../packages/contracts/src/modules/authentication/protocol/desktop-auth.types.ts',
    ),
    'utf8',
  );

  it('drops RegisterRequest name and uses EmailRegisterCredentials sole body', () => {
    expect(register).toContain('Residual 871');
    expect(register).toContain('Residual 931');
    expect(register).toContain('EmailRegisterCredentials');
    expect(register).toContain("from '@dailyuse/contracts/authentication'");
    expect(register).toContain('request: EmailRegisterCredentials');
    expect(register).not.toMatch(/export interface RegisterRequest\b/);
    expect(register).not.toMatch(/export type RegisterRequest\b/);
    expect(register).not.toMatch(/request: RegisterRequest\b/);
  });

  it('keeps sole EmailRegisterCredentials interface body in contracts', () => {
    expect(contractsAuth).toContain('Residual 931');
    expect(contractsAuth).toMatch(/export interface EmailRegisterCredentials\b/);
    expect(contractsAuth).toContain('email: string');
    expect(contractsAuth).toContain('password: string');
    expect(contractsAuth).toContain('username?: string');
    expect(contractsAuth).not.toMatch(/export interface RegisterRequest\b/);
  });

  it('coordinator uses EmailRegisterCredentials without local dual body', () => {
    expect(coordinator).toContain('Residual 931');
    expect(coordinator).toContain('async register(request: EmailRegisterCredentials)');
    expect(coordinator).toContain('EmailRegisterCredentials');
    expect(coordinator).not.toMatch(/export interface RegisterRequest\b/);
    expect(coordinator).not.toMatch(/export type \{ RegisterRequest \}/);
    expect(register).toContain('export async function registerDesktopAccount');
  });
});
