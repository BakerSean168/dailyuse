import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 873: OfflineLoginResponse dual retired.
 * Sole interface body in contracts desktop-auth.types; desktop session-types type-aliases only.
 */
describe('contracts OfflineLoginResponse dual retired (residual 873)', () => {
  const dir = __dirname;
  const source = readFileSync(resolve(dir, 'desktop-auth.types.ts'), 'utf8');
  const protocolIndex = readFileSync(resolve(dir, 'index.ts'), 'utf8');
  const sessionTypes = readFileSync(
    resolve(
      dir,
      '../../../../../../apps/desktop/src/main/modules/authentication/infrastructure/session-types.ts',
    ),
    'utf8',
  );

  it('owns OfflineLoginResponse sole interface body in contracts', () => {
    expect(source).toContain('Residual 873');
    expect(source).toMatch(/export interface OfflineLoginResponse\b/);
    expect(source).toContain('ok: boolean');
    expect(source).toContain('authMode?: AuthMode');
    expect(protocolIndex).toContain('OfflineLoginResponse');
  });

  it('desktop session-types re-exports OfflineLoginResponse as type alias only', () => {
    expect(sessionTypes).toContain('Residual 873');
    expect(sessionTypes).toContain('export type OfflineLoginResponse = ContractOfflineLoginResponse');
    expect(sessionTypes).not.toMatch(/export (?:interface|type) OfflineLoginResponse\s*=\s*\{/);
    expect(sessionTypes).not.toMatch(/export interface OfflineLoginResponse\b/);
  });

  it('does not reintroduce LoginResponse dual (residual 867)', () => {
    expect(source).toContain('Residual 867');
    expect(source).not.toMatch(/export interface LoginResponse\b/);
    expect(protocolIndex).not.toMatch(/(?<![A-Za-z])LoginResponse(?![A-Za-z])/);
  });
});
