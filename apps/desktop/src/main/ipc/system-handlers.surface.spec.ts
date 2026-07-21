import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DesktopFeatureChannels, SystemChannels } from '@dailyuse/contracts/electron';

/**
 * Desktop system/desktop-feature IPC surface (stage-6 residual):
 * system-handlers must register via contracts channel maps — no string dual-track.
 */
describe('system-handlers channel surface', () => {
  const source = readFileSync(resolve(__dirname, 'system-handlers.ts'), 'utf8');

  it('registers system and desktop-feature handlers via contracts channel maps', () => {
    expect(source).toContain('SystemChannels');
    expect(source).toContain('DesktopFeatureChannels');
    expect(source).toContain("from '@dailyuse/contracts/electron'");
    expect(source).toContain('SystemChannels.GET_APP_VERSION');
    expect(source).toContain('SystemChannels.OPEN_EXTERNAL_URL');
    expect(source).toContain('DesktopFeatureChannels.AUTO_LAUNCH_IS_ENABLED');
    expect(source).toContain('DesktopFeatureChannels.TRAY_FLASH');
    expect(source).not.toMatch(/ipcMain\.handle\(\s*'system:/);
    expect(source).not.toMatch(/ipcMain\.handle\(\s*'desktop:/);
  });

  it('keeps contracts values stable for live channels', () => {
    expect(SystemChannels.GET_APP_VERSION).toBe('system:getAppVersion');
    expect(DesktopFeatureChannels.TRAY_STOP_FLASH).toBe('desktop:tray:stopFlash');
  });
});
