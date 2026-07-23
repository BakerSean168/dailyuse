import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 907: setting themeSync inline electronAPI dual retired.
 * useThemeSync uses DesktopAuthApi sole invoke-api shape (no local inline dual object type).
 * Residual 905 (soft): reminder DesktopApi dual retired
 *   (modules/reminder/.../reminder-desktop-api-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('theme-sync DesktopAuthApi dual retired (residual 907)', () => {
  const composableDir = __dirname;
  const themeSync = readFileSync(resolve(composableDir, 'useThemeSync.ts'), 'utf8');
  const recovery = readFileSync(
    resolve(composableDir, '../../../shared/utils/desktop-auth-recovery.ts'),
    'utf8',
  );

  it('imports DesktopAuthApi and types host electronAPI from it', () => {
    expect(themeSync).toContain('Residual 907');
    expect(themeSync).toContain(
      "import type { DesktopAuthApi } from '../../../shared/utils/desktop-auth-recovery'",
    );
    expect(themeSync).toContain('electronAPI?: DesktopAuthApi');
    expect(themeSync).not.toMatch(
      /electronAPI\?:\s*\{\s*invoke\(?channel:\s*string/,
    );
  });

  it('keeps sole DesktopAuthApi object-type body in recovery module', () => {
    expect(recovery).toContain('Residual 907');
    expect(recovery).toMatch(/export type DesktopAuthApi = \{/);
    expect(recovery).toContain(
      'invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>',
    );
  });

  it('theme sync still invokes WindowChannels.SYNC_CHROME_THEME via optional invoke', () => {
    expect(themeSync).toContain('WindowChannels.SYNC_CHROME_THEME');
    expect(themeSync).toContain('function syncDesktopWindowChrome');
    expect(themeSync).toContain('.electronAPI?.invoke?.(');
  });
});
