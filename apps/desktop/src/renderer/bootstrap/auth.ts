import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { APP_TITLE_NAME } from '@memoflow/assets';
import { createI18nPlugin, loadLocaleMessages } from '@memoflow/app-vue/plugins/i18n';

import DesktopAuthApp from '../DesktopAuthApp.vue';
import { installDesktopAuthServices } from '../platform/di-auth';

export async function bootstrapAuthApp() {
  const app = createApp(DesktopAuthApp);

  app.use(createPinia());
  const localeMessages = await loadLocaleMessages('zh-CN');
  app.use(createI18nPlugin('zh-CN', localeMessages));
  app.use(installDesktopAuthServices);

  app.mount('#app');
  document.title = APP_TITLE_NAME;
}
