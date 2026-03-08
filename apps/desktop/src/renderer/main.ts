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
    additionalRoutes: [
      {
        path: '/custom-notification',
        name: 'custom-notification',
        component: () => import('./CustomNotificationView.vue'),
        meta: { requiresAuth: false, layout: 'empty' },
      },
    ],
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

startApp().catch((error) => {
  console.error('[DesktopRenderer] Failed to start app', error);

  const mountTarget = document.querySelector('#app');
  if (mountTarget) {
    mountTarget.innerHTML = `
      <div style="height:100%;display:flex;align-items:center;justify-content:center;padding:24px;background:#111827;color:#f9fafb;font-family:system-ui,sans-serif;">
        <div style="max-width:640px;">
          <h1 style="margin:0 0 12px;font-size:20px;">Desktop renderer failed to start</h1>
          <pre style="white-space:pre-wrap;word-break:break-word;background:#1f2937;padding:12px;border-radius:8px;overflow:auto;">${String(
            error instanceof Error ? error.stack ?? error.message : error,
          )}</pre>
        </div>
      </div>
    `;
  }
});
