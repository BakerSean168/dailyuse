import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 889: SessionStatus intentional extension keep-boundary.
 * Protocol SessionStatusDTO base → desktop SessionStatus (+ required device).
 * Domain VO enum SessionStatus (Active/Expired/Revoked) stays a separate concept.
 * Does not flip §13.2 checkboxes.
 */
describe('session-status extension keep-boundary (residual 889)', () => {
  const infraDir = __dirname;
  const sessionTypes = readFileSync(resolve(infraDir, 'session-types.ts'), 'utf8');
  const contractsAuth = readFileSync(
    resolve(
      infraDir,
      '../../../../../../../packages/contracts/src/modules/authentication/protocol/desktop-auth.types.ts',
    ),
    'utf8',
  );
  const voSessionStatus = readFileSync(
    resolve(
      infraDir,
      '../../../../../../../packages/contracts/src/modules/authentication/value-objects/session-status.ts',
    ),
    'utf8',
  );

  it('keeps contracts SessionStatusDTO as protocol base DTO body', () => {
    expect(contractsAuth).toContain('Residual 889');
    expect(contractsAuth).toMatch(/export interface SessionStatusDTO\b/);
    expect(contractsAuth).toContain('hasActiveSession: boolean');
    expect(contractsAuth).toContain('tokenStatus: TokenStatus');
    // Base DTO must not require device (desktop extension owns device)
    const start = contractsAuth.indexOf('export interface SessionStatusDTO');
    const brace = contractsAuth.indexOf('{', start);
    const end = contractsAuth.indexOf('\n}', brace);
    const body = contractsAuth.slice(brace, end + 2);
    expect(body).not.toMatch(/device\??\s*:/);
    expect(contractsAuth).not.toContain('export type SessionStatusDTO = SessionStatus');
  });

  it('keeps desktop SessionStatus as extension with required device', () => {
    expect(sessionTypes).toContain('Residual 889');
    expect(sessionTypes).toMatch(
      /export interface SessionStatus extends SessionStatusDTO\b/,
    );
    expect(sessionTypes).toContain('device: DeviceInfoClientDTO');
    // Required (non-optional) device
    expect(sessionTypes).not.toMatch(
      /export interface SessionStatus extends SessionStatusDTO \{[\s\S]*?device\?:/,
    );
    expect(sessionTypes).not.toContain(
      'export type SessionStatus = SessionStatusDTO',
    );
  });

  it('keeps domain VO SessionStatus enum separate from desktop protocol SessionStatus', () => {
    expect(voSessionStatus).toContain('Residual 889');
    expect(voSessionStatus).toContain('export const SessionStatus');
    expect(voSessionStatus).toContain("Active: 'Active'");
    expect(voSessionStatus).toContain("Expired: 'Expired'");
    expect(voSessionStatus).toContain("Revoked: 'Revoked'");
    expect(voSessionStatus).toMatch(
      /export type SessionStatus = \(typeof SessionStatus\)\[keyof typeof SessionStatus\]/,
    );
    // Domain enum is not the desktop interface extension (comment may name protocol duals).
    expect(voSessionStatus).not.toMatch(/export interface SessionStatusDTO\b/);
    expect(voSessionStatus).not.toMatch(/device:\s*DeviceInfoClientDTO/);
    expect(voSessionStatus).not.toContain('hasActiveSession');
  });
});
