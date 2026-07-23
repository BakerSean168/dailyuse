import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 923: isDesktopEnvironment name dual fully retired.
 * Auth composables detect desktop via hasDesktopAuthApi(window) directly.
 * Residual 909 (soft): Window typing + hasDesktopAuthApi detect
 *   (electron-window-desktop-api-dual.surface.spec.ts).
 * Residual 919 (soft): hasDesktopElectronBridge wrapper retired
 *   (desktop-detect-name-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('desktop isDesktopEnvironment name dual retired (residual 923)', () => {
  const utilsDir = __dirname;
  const authDir = resolve(utilsDir, '../../modules/authentication/composables');
  const authContext = readFileSync(resolve(authDir, 'useAuthContext.ts'), 'utf8');
  const useLogin = readFileSync(resolve(authDir, 'useLogin.ts'), 'utf8');
  const useRegister = readFileSync(resolve(authDir, 'useRegister.ts'), 'utf8');
  const useRemembered = readFileSync(resolve(authDir, 'useRememberedAccounts.ts'), 'utf8');
  const useGuest = readFileSync(resolve(authDir, 'useGuestMode.ts'), 'utf8');
  const recovery = readFileSync(resolve(utilsDir, 'desktop-auth-recovery.ts'), 'utf8');

  it('drops isDesktopEnvironment export from useAuthContext', () => {
    expect(authContext).toContain('Residual 923');
    expect(authContext).not.toMatch(/export const isDesktopEnvironment\b/);
    expect(authContext).not.toMatch(/function isDesktopEnvironment\b/);
    expect(authContext).not.toMatch(/isDesktopEnvironment\s*\(/);
  });

  it('auth composables detect desktop via hasDesktopAuthApi without name dual', () => {
    for (const [name, source] of [
      ['useLogin', useLogin],
      ['useRegister', useRegister],
      ['useRememberedAccounts', useRemembered],
      ['useGuestMode', useGuest],
    ] as const) {
      expect(source, name).toContain('Residual 923');
      expect(source, name).toContain('hasDesktopAuthApi(window)');
      expect(source, name).toContain(
        "from '../../../shared/utils/desktop-auth-recovery'",
      );
      expect(source, name).not.toMatch(/export const isDesktopEnvironment\b/);
      expect(source, name).not.toMatch(/function isDesktopEnvironment\b/);
      expect(source, name).not.toMatch(/isDesktopEnvironment\s*\(/);
      expect(source, name).not.toMatch(
        /import\s*\{[^}]*isDesktopEnvironment[^}]*\}\s*from\s*['"]\.\/useAuthContext['"]/,
      );
    }
    // type-only AuthContext imports remain
    expect(useLogin).toContain("import type { AuthContext } from './useAuthContext'");
    expect(useGuest).toContain("import type { AuthContext } from './useAuthContext'");
  });

  it('keeps sole hasDesktopAuthApi helper in recovery', () => {
    expect(recovery).toContain('Residual 923');
    expect(recovery).toContain('export function hasDesktopAuthApi');
    expect(recovery).toContain(
      'invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>',
    );
    expect(recovery).not.toMatch(/export const isDesktopEnvironment\b/);
    expect(recovery).not.toMatch(/function isDesktopEnvironment\b/);
    expect(recovery).not.toMatch(/isDesktopEnvironment\s*\(/);
  });
});
