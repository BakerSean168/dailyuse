import type { App } from 'vue';
import { DESKTOP_BRIDGE_KEY } from '@memoflow/app-vue/di';
// Residual 941: host bridge via requireElectronBridge sole helper.
import { requireElectronBridge } from './electron-bridge';

export function installDesktopAuthServices(app: App): void {
  const bridge = requireElectronBridge('installDesktopAuthServices');
  app.provide(DESKTOP_BRIDGE_KEY, bridge);
}
