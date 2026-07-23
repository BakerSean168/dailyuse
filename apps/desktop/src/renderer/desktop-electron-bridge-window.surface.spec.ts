import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 270: window.electronAPI is typed as ElectronBridge (no local ElectronAPI dual).
 * Residual 911 (soft): CustomNotificationView local ElectronBridge dual retired
 *   (custom-notification-electron-bridge-dual.surface.spec.ts).
 * Residual 941 (soft): host getElectronBridge sole helper
 *   (host-electron-bridge-helper-dual.surface.spec.ts).
 */
describe('desktop window electronAPI ElectronBridge surface', () => {
  const env = readFileSync(resolve(__dirname, 'env.d.ts'), 'utf8');
  const preload = readFileSync(resolve(__dirname, '../preload/preload.ts'), 'utf8');

  it('env.d.ts types window.electronAPI as ElectronBridge', () => {
    expect(env).toContain("from '@dailyuse/ipc-client'");
    expect(env).toContain('electronAPI?: ElectronBridge');
    expect(env).not.toMatch(/interface ElectronAPI\s*\{/);
  });

  it('preload re-exports ElectronBridge and drops ElectronAPI type dual', () => {
    expect(preload).toContain("export type { ElectronBridge } from '@dailyuse/ipc-client'");
    expect(preload).not.toContain('export type ElectronAPI');
    expect(preload).toContain('ElectronBridge');
  });
});
