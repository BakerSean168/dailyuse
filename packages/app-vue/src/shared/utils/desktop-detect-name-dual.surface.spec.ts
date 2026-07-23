import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 919: remaining desktop-detect / bootstrap-api name duals retired.
 * - hydrateDesktopBootstrapAuthState accepts DesktopAuthApi (no DesktopBootstrapApi name).
 * - router guards use hasDesktopAuthApi directly (no hasDesktopElectronBridge wrapper).
 * Residual 903 (soft): DesktopBootstrapApi dual retired path
 *   (desktop-bootstrap-api-dual.surface.spec.ts).
 * Residual 909 (soft): Window typing + hasDesktopAuthApi detect
 *   (electron-window-desktop-api-dual.surface.spec.ts).
 * Residual 923 (soft): isDesktopEnvironment name dual retired
 *   (desktop-environment-name-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('desktop detect/bootstrap name duals retired (residual 919)', () => {
  const utilsDir = __dirname;
  const bootstrap = readFileSync(resolve(utilsDir, 'desktop-bootstrap-auth.ts'), 'utf8');
  const recovery = readFileSync(resolve(utilsDir, 'desktop-auth-recovery.ts'), 'utf8');
  const guards = readFileSync(resolve(utilsDir, '../../router/guards.ts'), 'utf8');

  it('hydrate uses DesktopAuthApi sole param type (no DesktopBootstrapApi export)', () => {
    expect(bootstrap).toContain('Residual 919');
    expect(bootstrap).toContain('api?: DesktopAuthApi');
    expect(bootstrap).not.toMatch(/export type DesktopBootstrapApi\b/);
    expect(bootstrap).not.toMatch(/api\?: DesktopBootstrapApi\b/);
  });

  it('router guards detect desktop via hasDesktopAuthApi without name-wrapper dual', () => {
    expect(guards).toContain('Residual 919');
    expect(guards).toContain(
      "import { hasDesktopAuthApi } from '../shared/utils/desktop-auth-recovery'",
    );
    expect(guards).toContain('hasDesktopAuthApi(window)');
    expect(guards).not.toMatch(/function hasDesktopElectronBridge\b/);
    expect(guards).not.toContain('hasDesktopElectronBridge(');
  });

  it('keeps sole hasDesktopAuthApi helper and DesktopAuthApi body in recovery', () => {
    expect(recovery).toContain('Residual 919');
    expect(recovery).toContain('export function hasDesktopAuthApi');
    expect(recovery).toMatch(/export type DesktopAuthApi = \{/);
    expect(recovery).toContain(
      'invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>',
    );
  });
});
