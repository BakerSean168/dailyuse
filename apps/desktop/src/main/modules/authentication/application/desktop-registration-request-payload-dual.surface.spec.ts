import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 875: RegistrationRequestPayload dual retired.
 * Residual 931 (soft): RegisterRequest name dual fully retired — EmailRegisterCredentials sole body
 *   (desktop-register-request-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('desktop RegistrationRequestPayload dual retired (residual 875)', () => {
  const appDir = __dirname;
  const register = readFileSync(resolve(appDir, 'register-desktop-account.ts'), 'utf8');
  const gateway = readFileSync(resolve(appDir, 'auth-remote-gateway.ts'), 'utf8');

  it('uses EmailRegisterCredentials sole body (no RegisterRequest dual)', () => {
    expect(register).toContain('Residual 931');
    expect(register).toContain('request: EmailRegisterCredentials');
    expect(register).not.toMatch(/export interface RegisterRequest\b/);
    expect(register).not.toMatch(/export type RegisterRequest\b/);
  });

  it('gateway uses EmailRegisterCredentials and does not define RegistrationRequestPayload body', () => {
    expect(gateway).toContain('Residual 875');
    expect(gateway).toContain('Residual 931');
    expect(gateway).toContain('EmailRegisterCredentials');
    expect(gateway).toContain("from '@dailyuse/contracts/authentication'");
    expect(gateway).toContain('request: EmailRegisterCredentials');
    expect(gateway).not.toMatch(/export interface RegistrationRequestPayload\b/);
    expect(gateway).not.toMatch(/export type RegistrationRequestPayload\b/);
    expect(gateway).not.toContain("from './register-desktop-account'");
  });

  it('does not reintroduce a RegisterRequest interface body in gateway', () => {
    expect(gateway).not.toMatch(/export interface RegisterRequest\b/);
    expect(register).toContain('export async function registerDesktopAccount');
    expect(gateway).toContain('async register(');
  });
});
