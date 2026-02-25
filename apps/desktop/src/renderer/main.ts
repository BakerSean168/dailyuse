/**
 * Desktop Renderer Entry Point (Vue 3 Thin Shell)
 *
 * Mirrors the web app's main.ts but uses:
 * - Hash history (file:// protocol compatibility)
 * - IPC adapters instead of HTTP adapters
 * - Electron-specific features (titlebar, tray, shortcuts)
 */
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createWebHashHistory } from 'vue-router';

import { createAppRouter, useAuthenticationStore } from '@dailyuse/app-vue';
import { progressStart, progressDone } from '@dailyuse/ui-vue-shadcn';

import App from './App.vue';
import { installIpcServices } from './platform/di';
import { initElectronFeatures } from './platform/electron';

import './styles/index.css';

async function startApp() {
  const app = createApp(App);

  // Pinia
  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
  app.use(pinia);

  // Router (Hash mode for Electron file:// protocol)
  const router = createAppRouter({
    history: createWebHashHistory(),
    isAuthenticated: () => useAuthenticationStore().isAuthenticated,
  });

  router.beforeEach(() => {
    progressStart();
  });

  router.afterEach((to) => {
    progressDone();
    const title = to.meta.title as string | undefined;
    document.title = title ? `${title} - DailyUse` : 'DailyUse';
  });

  app.use(router);

  // DI — inject IPC-backed service instances
  app.use(installIpcServices);

  // Electron-specific features
  initElectronFeatures(app);

  app.mount('#app');
}

startApp();
