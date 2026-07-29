import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DesktopFeatureChannels, SystemChannels } from '@memoflow/contracts/electron';

/**
 * Desktop system/desktop-feature IPC surface (stage-6 residual):
 * system-handlers must register via contracts channel maps — no string dual-track —
 * and return contracts Result ok/fail envelopes (no raw dual-track payloads).
 */
describe('system-handlers channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'system-handlers.ts'), 'utf8');

  it('registers system and desktop-feature handlers via contracts channel maps', () => {
    expect(source).toContain('SystemChannels');
    expect(source).toContain('DesktopFeatureChannels');
    expect(source).toContain("from '@memoflow/contracts/electron'");
    expect(source).toContain('SystemChannels.GET_APP_VERSION');
    expect(source).toContain('SystemChannels.OPEN_EXTERNAL_URL');
    expect(source).toContain('DesktopFeatureChannels.AUTO_LAUNCH_IS_ENABLED');
    expect(source).toContain('DesktopFeatureChannels.TRAY_FLASH');
    expect(source).not.toMatch(/ipcMain\.handle\(\s*'system:/);
    expect(source).not.toMatch(/ipcMain\.handle\(\s*'desktop:/);
  });

  it('returns contracts Result ok/fail envelopes instead of raw dual-track payloads', () => {
    expect(source).toContain("import { fail, ok } from '@memoflow/contracts/result'");
    expect(source).toContain('return ok(');
    expect(source).toContain('return fail({');
    expect(source).toContain('return ok({ opened: true as const })');
    expect(source).not.toMatch(/return\s+app\.getVersion\(\)/);
    expect(source).not.toMatch(/return\s+\{\s*opened:\s*true\s*\}/);
    expect(source).not.toMatch(/success:\s*true/);
    expect(source).not.toMatch(/success:\s*false/);
  });

  it('keeps contracts values stable for live channels', () => {
    expect(SystemChannels.GET_APP_VERSION).toBe('system:getAppVersion');
    expect(DesktopFeatureChannels.TRAY_STOP_FLASH).toBe('desktop:tray:stopFlash');
  });
});
