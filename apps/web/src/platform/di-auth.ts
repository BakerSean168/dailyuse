import type { App } from 'vue';

import { AUTH_WEB_SERVICE_KEY } from '../auth/service';
import { authWebService } from './auth-web-service';

export function installAuthServices(app: App): void {
  app.provide(AUTH_WEB_SERVICE_KEY, authWebService);
}
