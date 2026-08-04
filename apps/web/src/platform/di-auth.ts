import type { App } from 'vue';
import { createCloudAuthHttpClient } from '@memoflow/cloud-auth';
import { AUTH_WEB_SERVICE_KEY } from '../auth/service';

export function installAuthServices(app: App): void {
  app.provide(
    AUTH_WEB_SERVICE_KEY,
    createCloudAuthHttpClient(undefined, { baseUrl: window.location.origin }),
  );
}
