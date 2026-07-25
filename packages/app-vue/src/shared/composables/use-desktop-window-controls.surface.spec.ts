import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 929: ElectronBridge window-controls keep-boundary.
 * - DESKTOP_BRIDGE_KEY inject primary; host electronAPI fallback only if full bridge.
 * - Shape needs invoke+on+off — must not collapse onto DesktopAuthApi (invoke-only).
 * Soft residual 913: host-access cast duals retired for auth paths
 *   (../utils/desktop-host-access-dual.surface.spec.ts).
 * Soft residual 909: Window.electronAPI typed as DesktopAuthApi
 *   (../utils/electron-window-desktop-api-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('useDesktopWindowControls ElectronBridge keep-boundary (residual 929)', () => {
  const source = readFileSync(resolve(__dirname, 'useDesktopWindowControls.ts'), 'utf8');
  const keys = readFileSync(resolve(__dirname, '../../di/keys.ts'), 'utf8');
  const recovery = readFileSync(resolve(__dirname, '../utils/desktop-auth-recovery.ts'), 'utf8');
  const electronDts = readFileSync(resolve(__dirname, '../types/electron.d.ts'), 'utf8');

  it('unwraps Result envelopes instead of casting raw IPC payloads', () => {
    expect(source).toContain("import { isOk, type Result } from '@dailyuse/contracts/result'");
    expect(source).toContain('function readResultData');
    expect(source).toContain('isOk(result)');
    expect(source).not.toMatch(/as\s*\|\s*Partial<WindowControlsState>/);
  });

  it('prefers DESKTOP_BRIDGE_KEY inject and narrows full ElectronBridge only', () => {
    expect(source).toContain('Residual 929');
    expect(source).toContain('inject(DESKTOP_BRIDGE_KEY, undefined)');
    expect(source).toContain('function isElectronBridge');
    expect(source).toContain("typeof candidate.invoke === 'function'");
    expect(source).toContain("typeof candidate.on === 'function'");
    expect(source).toContain("typeof candidate.off === 'function'");
    expect(source).toContain('bridge?.on(');
    expect(source).toContain('bridge?.off(');
    expect(source).toContain('bridge?.invoke(');
    // No forced collapse onto DesktopAuthApi helpers (comments may mention the keep-boundary).
    expect(source).not.toMatch(/import type \{[^}]*DesktopAuthApi/);
    expect(source).not.toMatch(/getDesktopAuthApi\s*\(/);
    expect(source).not.toMatch(/hasDesktopAuthApi\s*\(/);
    expect(source).not.toMatch(/export type DesktopAuthApi\b/);
  });

  it('keeps ElectronBridge InjectionKey and DesktopAuthApi invoke-only sole body separate', () => {
    expect(keys).toContain('export const DESKTOP_BRIDGE_KEY: InjectionKey<ElectronBridge>');
    expect(keys).toContain("import type { ElectronBridge } from '@dailyuse/ipc-client'");
    expect(recovery).toMatch(/export type DesktopAuthApi = \{/);
    expect(recovery).toContain(
      'invoke?: (channel: string, ...args: unknown[]) => Promise<unknown>',
    );
    expect(recovery).not.toMatch(/export type DesktopAuthApi[\s\S]*\bon\?:/);
    expect(electronDts).toContain('electronAPI?: DesktopAuthApi');
    expect(electronDts).toContain('Keep-boundary vs host ElectronBridge');
  });
});
