import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 887: AutoLoginResult intentional layered extension keep-boundary.
 * Protocol DTO base → infrastructure (+ domain session); lifecycle re-exports type only.
 * Residual 889 (soft): SessionStatus extension keep-boundary
 *   (infrastructure/session-status-extension-keep-boundary.surface.spec.ts).
 * Not an exact dual to collapse; base + extension stay separate interface bodies.
 * Does not flip §13.2 checkboxes.
 */
describe('auto-login-result extension keep-boundary (residual 887)', () => {
  const appDir = __dirname;
  const lifecycle = readFileSync(
    resolve(appDir, 'desktop-auth-lifecycle-coordinator.ts'),
    'utf8',
  );
  const sessionTypes = readFileSync(
    resolve(appDir, '../infrastructure/session-types.ts'),
    'utf8',
  );
  const contractsAuth = readFileSync(
    resolve(
      appDir,
      '../../../../../../../packages/contracts/src/modules/authentication/protocol/desktop-auth.types.ts',
    ),
    'utf8',
  );

  it('keeps contracts AutoLoginResult as protocol base DTO body', () => {
    expect(contractsAuth).toContain('Residual 887');
    expect(contractsAuth).toMatch(/export interface AutoLoginResult\b/);
    expect(contractsAuth).toContain('ok: boolean');
    expect(contractsAuth).toContain('authenticated: boolean');
    expect(contractsAuth).not.toContain(
      'export type AutoLoginResult = ContractAutoLoginResult',
    );
  });

  it('keeps infrastructure AutoLoginResult as extension with domain session', () => {
    expect(sessionTypes).toContain('Residual 887');
    expect(sessionTypes).toMatch(
      /export interface AutoLoginResult extends ContractAutoLoginResult\b/,
    );
    expect(sessionTypes).toContain('session?: AuthSession');
    expect(sessionTypes).not.toContain(
      'export type AutoLoginResult = ContractAutoLoginResult',
    );
  });

  it('lifecycle re-exports AutoLoginResult without a second interface body', () => {
    expect(lifecycle).toContain('Residual 887');
    expect(lifecycle).toContain(
      "export type { AutoLoginResult } from '../infrastructure/session-types'",
    );
    expect(lifecycle).not.toMatch(/export interface AutoLoginResult\b/);
    expect(lifecycle).toContain('async autoLogin(): Promise<AutoLoginResult>');
  });
});
