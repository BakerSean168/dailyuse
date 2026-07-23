import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 909: app-vue Window.electronAPI + desktop-detect duals retired.
 * Window typing and detect helpers use DesktopAuthApi sole invoke-api body.
 * Keep-boundary: host apps/desktop env.d.ts keeps ElectronBridge (invoke+on+off).
 * Residual 907 (soft): themeSync electronAPI dual retired
 *   (modules/setting/.../theme-sync-desktop-api-dual.surface.spec.ts).
 * Residual 905 (soft): reminder DesktopApi dual retired
 *   (modules/reminder/.../reminder-desktop-api-dual.surface.spec.ts).
 * Residual 913 (soft): host-access cast duals retired
 *   (desktop-host-access-dual.surface.spec.ts).
 * Residual 919 (soft): DesktopBootstrapApi name + hasDesktopElectronBridge wrapper retired
 *   (desktop-detect-name-dual.surface.spec.ts).
 * Residual 923 (soft): isDesktopEnvironment name dual retired
 *   (desktop-environment-name-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('electron window DesktopAuthApi dual retired (residual 909)', () => {
  const utilsDir = __dirname;
  const electronDts = readFileSync(resolve(utilsDir, '../types/electron.d.ts'), 'utf8');
  const recovery = readFileSync(resolve(utilsDir, 'desktop-auth-recovery.ts'), 'utf8');
  const authContext = readFileSync(
    resolve(utilsDir, '../../modules/authentication/composables/useAuthContext.ts'),
    'utf8',
  );
  const guards = readFileSync(resolve(utilsDir, '../../router/guards.ts'), 'utf8');

  it('types Window.electronAPI as DesktopAuthApi (no inline dual body)', () => {
    expect(electronDts).toContain('Residual 909');
    expect(electronDts).toContain(
      "import type { DesktopAuthApi } from '../utils/desktop-auth-recovery'",
    );
    expect(electronDts).toContain('electronAPI?: DesktopAuthApi');
    expect(electronDts).not.toMatch(
      /electronAPI\?:\s*\{\s*invoke\(?channel:\s*string/,
    );
    expect(electronDts).not.toMatch(/electronAPI\?:\s*ElectronBridge/);
    expect(electronDts).toContain('Keep-boundary vs host ElectronBridge');
  });

  it('owns hasDesktopAuthApi helper and keeps sole DesktopAuthApi body in recovery', () => {
    expect(recovery).toContain('Residual 909');
    expect(recovery).toMatch(/export type DesktopAuthApi = \{/);
    expect(recovery).toContain(
      'invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>',
    );
    expect(recovery).toContain('export function hasDesktopAuthApi');
    expect(recovery).toContain('typeof host?.electronAPI?.invoke === \'function\'');
  });

  it('auth context retires isDesktopEnvironment; router guards detect via hasDesktopAuthApi', () => {
    expect(authContext).toContain('Residual 909');
    expect(authContext).toContain('Residual 923');
    expect(authContext).not.toMatch(/export const isDesktopEnvironment\b/);
    expect(authContext).not.toMatch(/electronAPI\?:\s*\{\s*invoke\?/);

    expect(guards).toContain('Residual 909');
    expect(guards).toContain(
      "import { hasDesktopAuthApi } from '../shared/utils/desktop-auth-recovery'",
    );
    expect(guards).toContain('hasDesktopAuthApi(window)');
    expect(guards).not.toMatch(/electronAPI\?:\s*\{\s*invoke\?/);
  });
});
