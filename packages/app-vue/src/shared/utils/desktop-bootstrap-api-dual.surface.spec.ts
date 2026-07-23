import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 903: DesktopBootstrapApi dual retired.
 * Exact shape of DesktopAuthApi — type alias only (no second object-type body).
 * Residual 901 (soft): DesktopAuthStatus dual retired
 *   (desktop-auth-status-dual.surface.spec.ts).
 * Residual 905 (soft): reminder DesktopApi dual retired
 *   (modules/reminder/.../reminder-desktop-api-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('desktop DesktopBootstrapApi dual retired (residual 903)', () => {
  const utilsDir = __dirname;
  const bootstrap = readFileSync(resolve(utilsDir, 'desktop-bootstrap-auth.ts'), 'utf8');
  const recovery = readFileSync(resolve(utilsDir, 'desktop-auth-recovery.ts'), 'utf8');

  it('owns DesktopBootstrapApi as type alias of DesktopAuthApi', () => {
    expect(bootstrap).toContain('Residual 903');
    expect(bootstrap).toContain(
      "import type { DesktopAuthApi } from './desktop-auth-recovery'",
    );
    expect(bootstrap).toContain('export type DesktopBootstrapApi = DesktopAuthApi');
    expect(bootstrap).not.toMatch(
      /export type DesktopBootstrapApi = \{\s*invoke\?/,
    );
    expect(bootstrap).not.toMatch(/export interface DesktopBootstrapApi\b/);
  });

  it('keeps sole DesktopAuthApi object-type body in recovery module', () => {
    expect(recovery).toContain('Residual 903');
    expect(recovery).toMatch(/export type DesktopAuthApi = \{/);
    expect(recovery).toContain(
      'invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>',
    );
    expect(recovery).not.toContain('export type DesktopAuthApi = DesktopBootstrapApi');
  });

  it('bootstrap hydrate still accepts DesktopBootstrapApi name for local continuity', () => {
    expect(bootstrap).toContain(
      'export async function hydrateDesktopBootstrapAuthState',
    );
    expect(bootstrap).toContain('api?: DesktopBootstrapApi');
    expect(bootstrap).toContain('AuthChannels.GET_BOOTSTRAP_SNAPSHOT');
    expect(bootstrap).toContain('IpcResult<AuthBootstrapSnapshot>');
  });
});
