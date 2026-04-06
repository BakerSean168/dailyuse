import type { App } from 'vue';
import { AuthClientService } from '@dailyuse/authentication/application-client';
import { createAuthIpcAdapters } from '@dailyuse/authentication/infrastructure-client';
import { createResultIpcClient } from '@dailyuse/ipc-client';
import { AUTH_SERVICE_KEY } from '@dailyuse/app-vue';

export function installDesktopAuthServices(app: App): void {
  const resultIpcClient = createResultIpcClient();
  const authAdapters = createAuthIpcAdapters(resultIpcClient);
  app.provide(AUTH_SERVICE_KEY, new AuthClientService(authAdapters.auth));
}
