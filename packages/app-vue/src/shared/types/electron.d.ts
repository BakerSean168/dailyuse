import type { DesktopAuthApi } from '../utils/desktop-auth-recovery';

// Residual 909: Window.electronAPI dual retired — DesktopAuthApi sole invoke-api body.
// Keep-boundary vs host ElectronBridge (invoke+on+off) remains in apps/desktop env.d.ts.
export {};

declare global {
  interface Window {
    electronAPI?: DesktopAuthApi;
  }
}
