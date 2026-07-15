import { createApp } from 'vue';
import { APP_TITLE_NAME } from '@dailyuse/assets';

import AuthApp from '../AuthApp.vue';
import { installAuthServices } from '../platform/di-auth';
import { createAuthI18n } from '../auth/i18n';
import { prewarmMainAppBootstrap } from './prewarm';
import {
  applyAuthLocale,
  applyAuthTheme,
  readPresentationPreferenceState,
} from '../auth/presentation';

export async function bootstrapAuthApp() {
  const app = createApp(AuthApp);

  const presentation = readPresentationPreferenceState();
  applyAuthTheme();
  applyAuthLocale(presentation.locale);

  app.use(createAuthI18n(presentation.locale));
  app.use(installAuthServices);
  app.mount('#app');
  document.title = APP_TITLE_NAME;

  prewarmMainAppBootstrap();
}
