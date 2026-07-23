import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 236: session domain types live in session-types.
 * SessionManager does not dual-re-export them; index exports from session-types.
 */
/**
 * Residual 867 (soft): contracts LoginResponse dual deleted; OfflineLoginResponse remains sole offline result.
 */
describe('desktop auth session type export single-track surface', () => {
  const dir = __dirname;
  const sessionManager = readFileSync(resolve(dir, 'session-manager.ts'), 'utf8');
  const index = readFileSync(resolve(dir, 'index.ts'), 'utf8');
  const sessionTypes = readFileSync(resolve(dir, 'session-types.ts'), 'utf8');

  it('session-manager imports session types but does not re-export them', () => {
    expect(sessionManager).toContain("from './session-types'");
    expect(sessionManager).toContain('SessionRestoreResult');
    expect(sessionManager).toContain('AutoLoginResult');
    expect(sessionManager).toContain('SessionStatus');
    expect(sessionManager).toContain('OfflineLoginResponse');
    expect(sessionManager).not.toContain(
      "export type { SessionRestoreResult, AutoLoginResult, SessionStatus, OfflineLoginResponse } from './session-types'",
    );
    expect(sessionManager).not.toMatch(
      /export type \{[^}]*SessionRestoreResult[^}]*\} from '\.\/session-types'/,
    );
  });

  it('infrastructure index exports session types from session-types (not session-manager)', () => {
    expect(index).toContain("export { SessionManager } from './session-manager'");
    expect(index).toContain("from './session-types'");
    expect(index).toContain('SessionRestoreResult');
    expect(index).toContain('AutoLoginResult');
    expect(index).toContain('SessionStatus');
    expect(index).toContain('OfflineLoginResponse');
    // Residual 867: contracts LoginResponse dual not re-exported (word boundary; OfflineLoginResponse ok).
    expect(index).not.toMatch(/(?<![A-Za-z])LoginResponse(?![A-Za-z])/);
    expect(index).not.toContain(
      "export type { SessionRestoreResult, AutoLoginResult, SessionStatus } from './session-manager'",
    );
    expect(index).not.toMatch(
      /export type \{[^}]*SessionRestoreResult[^}]*\} from '\.\/session-manager'/,
    );
  });

  it('session-types owns the desktop session result interfaces', () => {
    expect(sessionTypes).toContain('export interface SessionRestoreResult');
    expect(sessionTypes).toContain('export interface AutoLoginResult');
    expect(sessionTypes).toContain('export interface SessionStatus');
    expect(sessionTypes).toContain('export type OfflineLoginResponse');
  });
});
