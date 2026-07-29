import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';
import { APP_TITLE_NAME } from '@memoflow/assets';
import { createI18nPlugin, loadLocaleMessages } from '@memoflow/app-vue/plugins/i18n';

import DesktopAuthApp from '../DesktopAuthApp.vue';
import { installDesktopAuthServices } from '../platform/di-auth';

function createDesktopAuthRouter() {
  return createRouter({
    history: createWebHashHistory(),
    routes: [
      {
        path: '/auth/:pathMatch(.*)*',
        name: 'auth',
        component: { template: '<div />' },
      },
      {
        path: '/:pathMatch(.*)*',
        redirect: '/auth',
      },
    ],
  });
}

export async function bootstrapAuthApp() {
  const app = createApp(DesktopAuthApp);

  app.use(createPinia());
  const localeMessages = await loadLocaleMessages('zh-CN');
  app.use(createI18nPlugin('zh-CN', localeMessages));
  app.use(createDesktopAuthRouter());
  app.use(installDesktopAuthServices);

  app.mount('#app');
  document.title = APP_TITLE_NAME;
}
