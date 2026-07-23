import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 236: application service is class/factory only.
 * Contracts and lifecycle types come from canonical modules, not convenience re-exports.
 */
describe('auth-desktop-application-service export single-track surface', () => {
  const source = readFileSync(resolve(__dirname, 'auth-desktop-application-service.ts'), 'utf8');

  it('does not re-export contracts result/auth types for convenience', () => {
    expect(source).toContain("from '@dailyuse/contracts/result'");
    expect(source).toContain("from '@dailyuse/contracts/authentication'");
    expect(source).not.toContain('Re-export from contracts for convenience');
    expect(source).not.toContain('export type { IpcResult, AuthStatus, EmailLoginCredentials }');
    expect(source).not.toContain('export { AuthMode, toIpcResult, ok, fail }');
  });

  it('does not re-export lifecycle types (import-only from coordinator)', () => {
    expect(source).toContain("from './desktop-auth-lifecycle-coordinator'");
    expect(source).not.toContain('Re-export lifecycle types');
    expect(source).not.toContain(
      "export type { AutoLoginResult, LifecycleSessionRestoreResult } from './desktop-auth-lifecycle-coordinator'",
    );
  });

  it('exports the application service class', () => {
    expect(source).toContain('export class AuthDesktopApplicationService');
  });
});
