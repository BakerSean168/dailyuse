import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 235: desktop auth infrastructure uses contracts token/network types only.
 * No TokenData dual alias; managers do not re-export contracts types.
 */
describe('desktop auth token/network type single-track surface', () => {
  const dir = __dirname;
  const tokenManager = readFileSync(resolve(dir, 'token-manager.ts'), 'utf8');
  const network = readFileSync(resolve(dir, 'network-state-manager.ts'), 'utf8');
  const index = readFileSync(resolve(dir, 'index.ts'), 'utf8');
  const tokenRefresh = readFileSync(resolve(dir, 'token-refresh.ts'), 'utf8');
  const guest = readFileSync(resolve(dir, 'guest-identity-helper.ts'), 'utf8');

  it('token-manager does not re-export contracts types or TokenData alias', () => {
    expect(tokenManager).toContain("from '@dailyuse/contracts/authentication'");
    expect(tokenManager).toContain('TokenStorageData');
    expect(tokenManager).not.toContain('Type Re-exports');
    expect(tokenManager).not.toContain('export type { TokenStorageData');
    expect(tokenManager).not.toContain('export type TokenData');
    expect(tokenManager).not.toMatch(/\bexport type \{[^}]*TokenData/);
  });

  it('network-state-manager does not re-export contracts network types', () => {
    expect(network).toContain("from '@dailyuse/contracts/authentication'");
    expect(network).toContain('export interface NetworkStateManagerConfig');
    expect(network).not.toContain('Re-export for convenience');
    expect(network).not.toContain(
      'export type { NetworkStatus, NetworkStateChangeEvent, NetworkCheckConfig }',
    );
  });

  it('infrastructure index exports token/network types from contracts only', () => {
    expect(index).toContain('TokenStorageData');
    expect(index).toContain('NetworkStatus');
    expect(index).toContain('NetworkCheckConfig');
    expect(index).not.toContain("export type { TokenData } from './token-manager'");
    expect(index).not.toContain("from './network-state-manager';\nexport type {\n  NetworkStatus");
  });

  it('token-refresh and guest helpers use TokenStorageData (no TokenData dual)', () => {
    for (const src of [tokenRefresh, guest]) {
      expect(src).toContain('TokenStorageData');
      expect(src).not.toMatch(/\bTokenData\b/);
    }
  });
});
