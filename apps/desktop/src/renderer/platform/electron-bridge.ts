import type { ElectronBridge } from '@dailyuse/ipc-client';

/**
 * Residual 941: sole host ElectronBridge access helpers for desktop renderer.
 * Local getElectronBridge dual in CustomNotificationView retired; platform DI/bootstrap
 * use these instead of scattered window.electronAPI reads.
 * Keep-boundary: host ElectronBridge (invoke+on+off) ≠ app-vue DesktopAuthApi (invoke-only).
 * Does not flip §13.2 checkboxes.
 */
export function getElectronBridge(): ElectronBridge | undefined {
  return window.electronAPI;
}

export function requireElectronBridge(context: string): ElectronBridge {
  const bridge = getElectronBridge();
  if (!bridge) {
    throw new Error(`${context} requires window.electronAPI (preload bridge)`);
  }
  return bridge;
}

export function ensureElectronBridgeAvailable(): void {
  if (getElectronBridge()) {
    return;
  }
  throw new Error(
    'Electron preload bridge is unavailable. Check BrowserWindow.webPreferences.preload and preload path resolution.',
  );
}
