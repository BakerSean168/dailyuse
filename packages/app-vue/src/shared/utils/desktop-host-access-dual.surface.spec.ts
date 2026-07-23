import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 913: remaining app-vue host-access cast duals retired.
 * useGuestMode / useThemeSync / AppShell use getDesktopAuthApi or hasDesktopAuthApi
 * (no inline Window & electronAPI / DesktopBootstrapApi cast duals).
 * Keep-boundary: useDesktopWindowControls still needs ElectronBridge (invoke+on+off).
 * Residual 909 (soft): Window typing + detect duals retired
 *   (electron-window-desktop-api-dual.surface.spec.ts).
 * Residual 907 (soft): themeSync DesktopAuthApi dual retired
 *   (modules/setting/.../theme-sync-desktop-api-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('desktop host-access dual retired (residual 913)', () => {
  const utilsDir = __dirname;
  const recovery = readFileSync(resolve(utilsDir, 'desktop-auth-recovery.ts'), 'utf8');
  const guest = readFileSync(
    resolve(utilsDir, '../../modules/authentication/composables/useGuestMode.ts'),
    'utf8',
  );
  const themeSync = readFileSync(
    resolve(utilsDir, '../../modules/setting/composables/useThemeSync.ts'),
    'utf8',
  );
  const shell = readFileSync(resolve(utilsDir, '../../layouts/shell/AppShell.vue'), 'utf8');
  const windowControls = readFileSync(
    resolve(utilsDir, '../composables/useDesktopWindowControls.ts'),
    'utf8',
  );

  it('useGuestMode hydrates via getDesktopAuthApi (no DesktopBootstrapApi cast dual)', () => {
    expect(guest).toContain('Residual 913');
    expect(guest).toContain(
      "import { getDesktopAuthApi } from '../../../shared/utils/desktop-auth-recovery'",
    );
    expect(guest).toContain('hydrateDesktopBootstrapAuthState(getDesktopAuthApi(window))');
    expect(guest).not.toMatch(/import type \{ DesktopBootstrapApi\b/);
    expect(guest).not.toMatch(/electronAPI\?: DesktopBootstrapApi/);
    expect(guest).not.toMatch(/as unknown as \{\s*electronAPI\?/);
  });

  it('useThemeSync and AppShell use recovery host helpers (no Window cast duals)', () => {
    expect(themeSync).toContain('Residual 913');
    expect(themeSync).toContain(
      "import { getDesktopAuthApi } from '../../../shared/utils/desktop-auth-recovery'",
    );
    expect(themeSync).toContain('getDesktopAuthApi(window)?.invoke?.(');
    expect(themeSync).not.toMatch(/Window\s*&\s*\{\s*electronAPI\?/);

    expect(shell).toContain('Residual 913');
    expect(shell).toContain(
      "import { hasDesktopAuthApi } from '../../shared/utils/desktop-auth-recovery'",
    );
    expect(shell).toContain('hasDesktopAuthApi(window)');
    expect(shell).not.toMatch(/electronAPI\?:\s*unknown/);
  });

  it('keeps getDesktopAuthApi/hasDesktopAuthApi sole helpers; ElectronBridge keep-boundary for window controls', () => {
    expect(recovery).toContain('Residual 913');
    expect(recovery).toContain('export function getDesktopAuthApi');
    expect(recovery).toContain('export function hasDesktopAuthApi');
    expect(recovery).toMatch(/export type DesktopAuthApi = \{/);
    expect(windowControls).toContain('ElectronBridge');
    expect(windowControls).toContain('DESKTOP_BRIDGE_KEY');
  });
});
