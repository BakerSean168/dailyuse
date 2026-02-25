/**
 * Desktop Platform — Electron-specific Feature Initialization
 *
 * Hooks into Electron IPC events for tray, shortcuts, online/offline,
 * and window state management. Called once during app startup.
 */
import type { App } from 'vue';

const api = window.electronAPI;

export function initElectronFeatures(_: App): void {
  if (!api) return;

  setupTraySync();
  setupShortcuts();
  setupOnlineStatus();
  setupWindowState();
}

function setupTraySync(): void {
  api?.on('tray:action', (...args: unknown[]) => {
    const action = args[1] as string | undefined;
    if (action) {
      console.log('[Electron] Tray action:', action);
    }
  });
}

function setupShortcuts(): void {
  api?.on('shortcut:triggered', (...args: unknown[]) => {
    const shortcut = args[1] as string | undefined;
    if (shortcut) {
      console.log('[Electron] Shortcut triggered:', shortcut);
    }
  });
}

function setupOnlineStatus(): void {
  window.addEventListener('online', () => {
    console.log('[Electron] Network: online');
  });
  window.addEventListener('offline', () => {
    console.log('[Electron] Network: offline');
  });
}

function setupWindowState(): void {
  api?.invoke('window:get-state').catch(() => {
    // Window state retrieval is optional; ignore errors
  });
}
