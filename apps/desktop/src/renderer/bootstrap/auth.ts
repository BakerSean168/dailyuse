import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';
import { APP_TITLE_NAME } from '@dailyuse/assets';
import { createI18nPlugin } from '@dailyuse/app-vue';

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
  app.use(createI18nPlugin('zh-CN'));
  app.use(createDesktopAuthRouter());
  app.use(installDesktopAuthServices);

  app.mount('#app');
  document.title = APP_TITLE_NAME;
}
