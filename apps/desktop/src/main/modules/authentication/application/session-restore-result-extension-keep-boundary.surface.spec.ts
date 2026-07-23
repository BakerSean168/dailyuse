import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 883: SessionRestoreResult intentional layered extension keep-boundary.
 * Protocol DTO base → infrastructure (+ domain session) → lifecycle (required hasValidSession).
 * Residual 935: lifecycle name dual retired — LifecycleSessionRestoreResult sole lifecycle name
 *   (contracts/infrastructure keep SessionRestoreResult; shape keep-boundary preserved).
 * Residual 887 (soft): AutoLoginResult layered extension keep-boundary
 *   (auto-login-result-extension-keep-boundary.surface.spec.ts).
 * Not an exact dual to collapse; each layer stays a separate interface body.
 * Does not flip §13.2 checkboxes.
 */
describe('session-restore-result extension keep-boundary (residual 883/935)', () => {
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
  const appService = readFileSync(
    resolve(appDir, 'auth-desktop-application-service.ts'),
    'utf8',
  );

  it('keeps contracts SessionRestoreResult as protocol base DTO body', () => {
    expect(contractsAuth).toContain('Residual 883');
    expect(contractsAuth).toContain('Residual 935');
    expect(contractsAuth).toMatch(/export interface SessionRestoreResult\b/);
    // Optional hasValidSession on protocol DTO
    expect(contractsAuth).toMatch(/hasValidSession\?:\s*boolean/);
    // Not a type alias of desktop layers
    expect(contractsAuth).not.toContain(
      'export type SessionRestoreResult = InfrastructureSessionRestoreResult',
    );
    expect(contractsAuth).not.toMatch(/export interface LifecycleSessionRestoreResult\b/);
  });

  it('keeps infrastructure SessionRestoreResult as extension with domain session', () => {
    expect(sessionTypes).toContain('Residual 883');
    expect(sessionTypes).toContain('Residual 935');
    expect(sessionTypes).toMatch(
      /export interface SessionRestoreResult extends ContractSessionRestoreResult\b/,
    );
    expect(sessionTypes).toContain('session?: AuthSession');
    // Must not collapse to type alias of contracts
    expect(sessionTypes).not.toContain(
      'export type SessionRestoreResult = ContractSessionRestoreResult',
    );
    expect(sessionTypes).not.toMatch(/export interface LifecycleSessionRestoreResult\b/);
  });

  it('keeps lifecycle LifecycleSessionRestoreResult as named extension with required hasValidSession', () => {
    expect(lifecycle).toContain('Residual 883');
    expect(lifecycle).toContain('Residual 935');
    expect(lifecycle).toMatch(
      /export interface LifecycleSessionRestoreResult extends InfrastructureSessionRestoreResult\b/,
    );
    // Required (non-optional) hasValidSession
    expect(lifecycle).toMatch(/hasValidSession:\s*boolean/);
    expect(lifecycle).not.toMatch(
      /export interface LifecycleSessionRestoreResult extends InfrastructureSessionRestoreResult \{[\s\S]*?hasValidSession\?:/,
    );
    // Lifecycle name dual retired — no second SessionRestoreResult interface body
    expect(lifecycle).not.toMatch(/export interface SessionRestoreResult\b/);
    expect(lifecycle).not.toContain(
      'export type LifecycleSessionRestoreResult = InfrastructureSessionRestoreResult',
    );
    expect(lifecycle).not.toContain(
      'export type SessionRestoreResult = InfrastructureSessionRestoreResult',
    );
    // initialize returns LifecycleSessionRestoreResult with hasValidSession
    expect(lifecycle).toContain(
      'async initialize(): Promise<LifecycleSessionRestoreResult>',
    );
    expect(lifecycle).toContain('hasValidSession:');
  });

  it('application service initialize uses LifecycleSessionRestoreResult sole lifecycle name', () => {
    expect(appService).toContain('type LifecycleSessionRestoreResult');
    expect(appService).toContain(
      'async initialize(): Promise<LifecycleSessionRestoreResult>',
    );
    expect(appService).not.toMatch(
      /type SessionRestoreResult[,\s]/
    );
    expect(appService).not.toContain(
      'async initialize(): Promise<SessionRestoreResult>',
    );
  });
});
