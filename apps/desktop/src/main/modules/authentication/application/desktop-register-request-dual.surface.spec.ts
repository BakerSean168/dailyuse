import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 871: RegisterRequest dual retired.
 * Sole interface body in register-desktop-account; coordinator re-exports type only.
 * Soft residual 875: RegistrationRequestPayload dual retired in
 *   desktop-registration-request-payload-dual.surface.spec.ts.
 */
describe('desktop RegisterRequest dual retired (residual 871)', () => {
  const appDir = __dirname;
  const register = readFileSync(resolve(appDir, 'register-desktop-account.ts'), 'utf8');
  const coordinator = readFileSync(
    resolve(appDir, 'desktop-credential-auth-coordinator.ts'),
    'utf8',
  );

  it('owns RegisterRequest sole interface body in register-desktop-account', () => {
    expect(register).toContain('Residual 871');
    expect(register).toMatch(/export interface RegisterRequest\b/);
    expect(register).toContain('email: string');
    expect(register).toContain('password: string');
    expect(register).toContain('username?: string');
  });

  it('coordinator re-exports RegisterRequest without a second interface body', () => {
    expect(coordinator).toContain('Residual 871');
    expect(coordinator).toContain("type RegisterRequest");
    expect(coordinator).toContain("from './register-desktop-account'");
    expect(coordinator).toContain('export type { RegisterRequest }');
    expect(coordinator).not.toMatch(/export interface RegisterRequest\b/);
  });

  it('registerDesktopAccount and coordinator still use RegisterRequest name', () => {
    expect(register).toContain('request: RegisterRequest');
    expect(register).toContain('export async function registerDesktopAccount');
    expect(coordinator).toContain('async register(request: RegisterRequest)');
    expect(coordinator).toContain('request: RegisterRequest');
  });
});
