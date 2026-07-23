import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 875: RegistrationRequestPayload dual retired.
 * RegisterRequest sole body in register-desktop-account; gateway uses RegisterRequest only.
 */
describe('desktop RegistrationRequestPayload dual retired (residual 875)', () => {
  const appDir = __dirname;
  const register = readFileSync(resolve(appDir, 'register-desktop-account.ts'), 'utf8');
  const gateway = readFileSync(resolve(appDir, 'auth-remote-gateway.ts'), 'utf8');

  it('keeps sole RegisterRequest interface body in register-desktop-account', () => {
    expect(register).toContain('Residual 871');
    expect(register).toMatch(/export interface RegisterRequest\b/);
    expect(register).toContain('email: string');
    expect(register).toContain('password: string');
    expect(register).toContain('username?: string');
  });

  it('gateway uses RegisterRequest and does not define RegistrationRequestPayload body', () => {
    expect(gateway).toContain('Residual 875');
    expect(gateway).toContain("from './register-desktop-account'");
    expect(gateway).toContain("import type { RegisterRequest } from './register-desktop-account'");
    expect(gateway).toContain('request: RegisterRequest');
    expect(gateway).not.toMatch(/export interface RegistrationRequestPayload\b/);
    expect(gateway).not.toMatch(/export type RegistrationRequestPayload\b/);
    // Comment may mention the retired dual name; no live definition/export.
  });

  it('does not reintroduce a second RegisterRequest interface body in gateway', () => {
    expect(gateway).not.toMatch(/export interface RegisterRequest\b/);
    expect(register).toContain('export async function registerDesktopAccount');
    expect(gateway).toContain('async register(');
  });
});
