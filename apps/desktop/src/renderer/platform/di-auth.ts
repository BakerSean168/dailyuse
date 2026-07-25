import type { App } from 'vue';
import { createAuthenticationIpcClient } from '@dailyuse/authentication/client';
import { createResultIpcClient } from '@dailyuse/ipc-client';
import { AUTH_SERVICE_KEY } from '@dailyuse/app-vue/di';
// Residual 941: host bridge via requireElectronBridge sole helper.
import { requireElectronBridge } from './electron-bridge';

export function installDesktopAuthServices(app: App): void {
  const bridge = requireElectronBridge('installDesktopAuthServices');
  const resultIpcClient = createResultIpcClient({ bridge });
  app.provide(AUTH_SERVICE_KEY, createAuthenticationIpcClient(resultIpcClient));
}
