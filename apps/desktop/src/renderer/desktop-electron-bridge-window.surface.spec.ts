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
  const app = readFileSync(resolve(__dirname, 'App.vue'), 'utf8');
  const rendererStyles = readFileSync(resolve(__dirname, 'styles/index.css'), 'utf8');

  it('env.d.ts types window.electronAPI as ElectronBridge', () => {
    expect(env).toContain("from '@memoflow/ipc-client'");
    expect(env).toContain('electronAPI?: ElectronBridge');
    expect(env).not.toMatch(/interface ElectronAPI\s*\{/);
  });

  it('owns the packaged WindowHeader drag contract in Desktop host styles', () => {
    const desktopContentCss = app.match(/\.desktop-content\s*\{[^}]*\}/u)?.[0] ?? '';
    expect(desktopContentCss).not.toContain('app-region');
    expect(rendererStyles).toContain('.window-header.window-header--drag');
    expect(rendererStyles).toMatch(/-webkit-app-region:\s*drag/u);
    expect(rendererStyles).toMatch(/\.window-header\.window-header--drag button[\s\S]*-webkit-app-region:\s*no-drag/u);
  });

  it('preload re-exports ElectronBridge and drops ElectronAPI type dual', () => {
    expect(preload).toContain("export type { ElectronBridge } from '@memoflow/ipc-client'");
    expect(preload).not.toContain('export type ElectronAPI');
    expect(preload).toContain('ElectronBridge');
  });
});
