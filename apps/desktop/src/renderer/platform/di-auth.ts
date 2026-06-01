import type { App } from 'vue';
import { AuthClientService } from '@dailyuse/authentication/application-client';
import { createAuthIpcAdapters } from '@dailyuse/authentication/infrastructure-client';
import { createResultIpcClient } from '@dailyuse/ipc-client';
import { AUTH_SERVICE_KEY } from '@dailyuse/app-vue/di';

export function installDesktopAuthServices(app: App): void {
  const bridge = window.electronAPI;
  if (!bridge) {
    throw new Error('installDesktopAuthServices requires window.electronAPI (preload bridge)');
  }
  const resultIpcClient = createResultIpcClient({ bridge });
  const authAdapters = createAuthIpcAdapters(resultIpcClient);
  app.provide(AUTH_SERVICE_KEY, new AuthClientService(authAdapters.auth));
}
