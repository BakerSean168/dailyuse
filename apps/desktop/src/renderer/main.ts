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

import {
  createAppRouter,
  useAuthenticationStore,
  createI18nPlugin,
  registerNotificationInitializationTasks,
} from '@dailyuse/app-vue';
import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { progressStart, progressDone } from '@dailyuse/ui-vue-shadcn';

import App from './App.vue';
import { installIpcServices } from './platform/di';
import { initElectronFeatures } from './platform/electron';

import './styles/index.css';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }

  return String(error);
}

function renderStartupError(error: unknown): void {
  console.error('[DesktopRenderer] Unhandled renderer error', error);

  const mountTarget = document.querySelector('#app');
  if (!mountTarget) {
    return;
  }

  mountTarget.innerHTML = `
    <div style="height:100%;display:flex;align-items:center;justify-content:center;padding:24px;background:#111827;color:#f9fafb;font-family:system-ui,sans-serif;">
      <div style="max-width:720px;">
        <h1 style="margin:0 0 12px;font-size:20px;">Desktop renderer failed</h1>
        <pre style="white-space:pre-wrap;word-break:break-word;background:#1f2937;padding:12px;border-radius:8px;overflow:auto;">${escapeHtml(
          formatError(error),
        )}</pre>
      </div>
    </div>
  `;
}

function ensureElectronBridgeAvailable(): void {
  if (window.electronAPI) {
    return;
  }

  throw new Error(
    'Electron preload bridge is unavailable. Check BrowserWindow.webPreferences.preload and preload path resolution.',
  );
}

async function startApp() {
  const app = createApp(App);

  app.config.errorHandler = (error) => {
    renderStartupError(error);
  };

  window.addEventListener('error', (event) => {
    renderStartupError(event.error ?? event.message);
  });

  window.addEventListener('unhandledrejection', (event) => {
    renderStartupError(event.reason);
  });

  ensureElectronBridgeAvailable();

  // Pinia
  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
  app.use(pinia);

  // I18n — required before any app-vue composable or global component uses useI18n()
  app.use(createI18nPlugin('zh-CN'));

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

  registerNotificationInitializationTasks();
  await InitializationManager.getInstance().executePhase(InitializationPhase.APP_STARTUP);

  // Electron-specific features
  initElectronFeatures(app);

  app.mount('#app');
}

startApp().catch((error) => {
  renderStartupError(error);
});
