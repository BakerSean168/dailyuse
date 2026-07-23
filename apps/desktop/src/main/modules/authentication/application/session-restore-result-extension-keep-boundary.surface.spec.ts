import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 883: SessionRestoreResult intentional layered extension keep-boundary.
 * Protocol DTO base → infrastructure (+ domain session) → lifecycle (required hasValidSession).
 * Not an exact dual to collapse; each layer stays a separate interface body.
 * Does not flip §13.2 checkboxes.
 */
describe('session-restore-result extension keep-boundary (residual 883)', () => {
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

  it('keeps contracts SessionRestoreResult as protocol base DTO body', () => {
    expect(contractsAuth).toContain('Residual 883');
    expect(contractsAuth).toMatch(/export interface SessionRestoreResult\b/);
    // Optional hasValidSession on protocol DTO
    expect(contractsAuth).toMatch(/hasValidSession\?:\s*boolean/);
    // Not a type alias of desktop layers
    expect(contractsAuth).not.toContain(
      'export type SessionRestoreResult = InfrastructureSessionRestoreResult',
    );
  });

  it('keeps infrastructure SessionRestoreResult as extension with domain session', () => {
    expect(sessionTypes).toContain('Residual 883');
    expect(sessionTypes).toMatch(
      /export interface SessionRestoreResult extends ContractSessionRestoreResult\b/,
    );
    expect(sessionTypes).toContain('session?: AuthSession');
    // Must not collapse to type alias of contracts
    expect(sessionTypes).not.toContain(
      'export type SessionRestoreResult = ContractSessionRestoreResult',
    );
  });

  it('keeps lifecycle SessionRestoreResult as extension with required hasValidSession', () => {
    expect(lifecycle).toContain('Residual 883');
    expect(lifecycle).toMatch(
      /export interface SessionRestoreResult extends InfrastructureSessionRestoreResult\b/,
    );
    // Required (non-optional) hasValidSession
    expect(lifecycle).toMatch(/hasValidSession:\s*boolean/);
    expect(lifecycle).not.toMatch(
      /export interface SessionRestoreResult extends InfrastructureSessionRestoreResult \{[\s\S]*?hasValidSession\?:/,
    );
    expect(lifecycle).not.toContain(
      'export type SessionRestoreResult = InfrastructureSessionRestoreResult',
    );
    // initialize still returns SessionRestoreResult with hasValidSession
    expect(lifecycle).toContain('async initialize(): Promise<SessionRestoreResult>');
    expect(lifecycle).toContain('hasValidSession:');
  });
});
