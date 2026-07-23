import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Residual 911: CustomNotificationView local ElectronBridge dual retired.
 * Uses @dailyuse/ipc-client ElectronBridge sole body (same as residual 270 window typing).
 * Residual 270 (soft): window.electronAPI typed as ElectronBridge
 *   (desktop-electron-bridge-window.surface.spec.ts).
 * Residual 909 (soft): app-vue Window uses DesktopAuthApi invoke-only keep-boundary
 *   (packages/app-vue .../electron-window-desktop-api-dual.surface.spec.ts).
 * Does not flip §13.2 checkboxes.
 */
describe('custom notification ElectronBridge dual retired (residual 911)', () => {
  const rendererDir = __dirname;
  const view = readFileSync(resolve(rendererDir, 'CustomNotificationView.vue'), 'utf8');
  const ipcTypes = readFileSync(
    resolve(rendererDir, '../../../../packages/ipc-client/src/types.ts'),
    'utf8',
  );
  const env = readFileSync(resolve(rendererDir, 'env.d.ts'), 'utf8');

  it('imports ElectronBridge from ipc-client and drops local interface dual', () => {
    expect(view).toContain('Residual 911');
    expect(view).toContain("import type { ElectronBridge } from '@dailyuse/ipc-client'");
    expect(view).toContain('function getElectronBridge(): ElectronBridge | undefined');
    expect(view).toContain('return window.electronAPI');
    expect(view).not.toMatch(/interface ElectronBridge\s*\{/);
    expect(view).not.toMatch(/type ElectronBridge\s*=\s*\{/);
  });

  it('keeps sole ElectronBridge object body in ipc-client types', () => {
    expect(ipcTypes).toMatch(/export interface ElectronBridge\s*\{/);
    expect(ipcTypes).toContain('invoke(channel: string, ...args: unknown[]): Promise<unknown>');
    expect(ipcTypes).toContain('on(channel: string, callback: (...args: unknown[]) => void): void');
    expect(ipcTypes).toContain('off(channel: string, callback: (...args: unknown[]) => void): void');
  });

  it('still consumes invoke/on/off notification channels via getElectronBridge', () => {
    expect(env).toContain('electronAPI?: ElectronBridge');
    expect(view).toContain('NotificationChannels.CUSTOM_RECEIVE');
    expect(view).toContain('getElectronBridge().on(');
    expect(view).toContain('getElectronBridge().off(');
    expect(view).toContain('getElectronBridge().invoke(');
  });
});
