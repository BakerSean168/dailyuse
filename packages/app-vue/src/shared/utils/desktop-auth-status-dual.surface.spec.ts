import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 901: DesktopAuthStatus dual retired.
 * app-vue recovery uses contracts AuthStatus sole body (no local slim dual interface/type).
 * Residual 865 (soft): AuthStatusDTO simplified dual already deleted in contracts protocol.
 * Residual 899 (soft): LoginRequest ≠ EmailLoginCredentials keep-boundary
 *   (apps/desktop .../login-request-email-credentials-keep-boundary.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('desktop AuthStatus dual retired (residual 901)', () => {
  const utilsDir = __dirname;
  const recovery = readFileSync(resolve(utilsDir, 'desktop-auth-recovery.ts'), 'utf8');
  const contractsAuth = readFileSync(
    resolve(
      utilsDir,
      '../../../../contracts/src/modules/authentication/protocol/desktop-auth.types.ts',
    ),
    'utf8',
  );

  it('recovery imports and uses contracts AuthStatus (no local DesktopAuthStatus dual)', () => {
    expect(recovery).toContain('Residual 901');
    expect(recovery).toContain(
      "import type { AuthStatus } from '@dailyuse/contracts/authentication'",
    );
    expect(recovery).toContain('Promise<AuthStatus | null>');
    expect(recovery).toContain('as IpcResult<AuthStatus>');
    expect(recovery).not.toMatch(/type DesktopAuthStatus\s*=/);
    expect(recovery).not.toMatch(/interface DesktopAuthStatus\b/);
    expect(recovery).not.toContain('IpcResult<DesktopAuthStatus>');
  });

  it('contracts keeps sole AuthStatus body (AuthStatusDTO stays deleted)', () => {
    expect(contractsAuth).toMatch(/export interface AuthStatus\b/);
    expect(contractsAuth).toContain('authenticated: boolean');
    expect(contractsAuth).toContain('runtimeState: AuthRuntimeState');
    expect(contractsAuth).toContain('mode: AuthMode');
    expect(contractsAuth).toContain('user: UserInfo | null');
    expect(contractsAuth).toContain('session: SessionInfo | null');
    expect(contractsAuth).not.toMatch(/export interface AuthStatusDTO\b/);
    expect(contractsAuth).not.toContain('export type AuthStatusDTO = AuthStatus');
    // Residual 865 pointer still present
    expect(contractsAuth).toContain('Residual 865');
  });

  it('AuthBootstrapSnapshot composes AuthStatus (sole status field type)', () => {
    expect(contractsAuth).toMatch(/export interface AuthBootstrapSnapshot\b/);
    expect(contractsAuth).toContain('status: AuthStatus');
    expect(contractsAuth).not.toContain('status: AuthStatusDTO');
    expect(contractsAuth).not.toContain('status: DesktopAuthStatus');
  });
});
