import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 869: DesktopLoginRequest dual retired.
 * Exact shape of EmailLoginCredentials — type alias only (no second interface body).
 */
describe('desktop DesktopLoginRequest dual retired (residual 869)', () => {
  const appDir = __dirname;
  const login = readFileSync(resolve(appDir, 'login-desktop-account.ts'), 'utf8');
  const contractsAuth = readFileSync(
    resolve(
      appDir,
      '../../../../../../../packages/contracts/src/modules/authentication/protocol/desktop-auth.types.ts',
    ),
    'utf8',
  );

  it('owns DesktopLoginRequest as type alias of EmailLoginCredentials', () => {
    expect(login).toContain('Residual 869');
    expect(login).toContain('export type DesktopLoginRequest = EmailLoginCredentials');
    expect(login).not.toMatch(/export interface DesktopLoginRequest\b/);
    expect(login).toContain("type EmailLoginCredentials");
  });

  it('keeps sole EmailLoginCredentials interface body in contracts', () => {
    expect(contractsAuth).toContain('Residual 869');
    expect(contractsAuth).toMatch(/export interface EmailLoginCredentials\b/);
    expect(contractsAuth).not.toMatch(/export interface DesktopLoginRequest\b/);
  });

  it('loginDesktopAccount still uses DesktopLoginRequest name for local export continuity', () => {
    expect(login).toContain('request: DesktopLoginRequest');
    expect(login).toContain('export async function loginDesktopAccount');
    expect(login).toContain('onSuccess?: (response: AuthResponseDTO, request: DesktopLoginRequest)');
  });
});
