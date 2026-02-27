/**
 * Web App Entry Point
 *
 * 薄壳：Vue 3 + Pinia + app-vue Router + Platform DI + PowerSync
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createWebHistory } from 'vue-router';
import {
  createAppRouter,
  useAuthenticationStore,
  createPowerSyncVuePlugin,
  createI18nPlugin,
} from '@dailyuse/app-vue';
import { progressStart, progressDone } from '@dailyuse/ui-vue-shadcn';

import App from './App.vue';
import { installWebServices } from './platform/di';
import { powerSyncDbRef } from './platform/powersync';
import './styles/index.css';

// Polyfill crypto.randomUUID for non-secure contexts
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  crypto.randomUUID = () => {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
      (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16),
    ) as `${string}-${string}-${string}-${string}-${string}`;
  };
}

async function startApp() {
  // MSW mock in development
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_API === 'true') {
    const { worker } = await import('./mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }

  const app = createApp(App);

  // Pinia
  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
  app.use(pinia);

  // I18n — must be after Pinia (locale bridge reads store) but before Router
  app.use(createI18nPlugin('zh-CN'));

  // Router (Web History)
  const router = createAppRouter({
    history: createWebHistory(),
    isAuthenticated: () => useAuthenticationStore().isAuthenticated,
  });
  router.beforeEach(() => progressStart());
  router.afterEach((to) => {
    progressDone();
    const title = to.meta.title as string | undefined;
    document.title = title ? `${title} - DailyUse` : 'DailyUse';
  });
  app.use(router);

  // Platform DI — HTTP-backed services + navigation
  app.use(installWebServices);

  // PowerSync — reactive sync database (ref starts null, set after auth in App.vue)
  app.use(createPowerSyncVuePlugin(powerSyncDbRef));

  app.mount('#app');
}

startApp();
