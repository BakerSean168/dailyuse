import type { App } from 'vue';
import { createAuthenticationIpcClient } from '@dailyuse/authentication/client';
import { createResultIpcClient } from '@dailyuse/ipc-client';
import { AUTH_SERVICE_KEY } from '@dailyuse/app-vue/di';

export function installDesktopAuthServices(app: App): void {
  const bridge = window.electronAPI;
  if (!bridge) {
    throw new Error('installDesktopAuthServices requires window.electronAPI (preload bridge)');
  }
  const resultIpcClient = createResultIpcClient({ bridge });
  app.provide(AUTH_SERVICE_KEY, createAuthenticationIpcClient(resultIpcClient));
}
