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
import { applyDocumentIcons, logo128, logoIco } from '@dailyuse/assets';

import {
  createAppRouter,
  useAuthenticationStore,
  createI18nPlugin,
  registerNotificationInitializationTasks,
  DesktopAuthView,
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

/**
 * Validates Pinia-persisted auth state against the main process session.
 *
 * If the renderer thinks it is authenticated (from a previous session) but
 * the main process has no live session, we try `auth:initialize` first
 * (which restores from encrypted tokens / SQLite). If that also fails,
 * we clear the store so the router guard redirects to login.
 */
async function syncRendererAuthState(): Promise<void> {
  const store = useAuthenticationStore();
  if (!store.isAuthenticated) return; // nothing persisted — skip sync

  try {
    // 1. Ask main process for current auth status
    const status = await window.electronAPI!.invoke('auth:get-status') as {
      authenticated: boolean;
      mode?: string;
    };

    if (status.authenticated) return; // main process agrees — all good

    // 2. Main process has no session — try restoring it
    const initResult = await window.electronAPI!.invoke('auth:initialize') as {
      ok?: boolean;
      hasValidSession?: boolean;
    };

    if (initResult?.ok && initResult?.hasValidSession) return; // restored

    // 3. Could not restore — clear stale renderer state
    console.warn('[Auth Sync] Main process has no valid session, clearing renderer auth state');
    store.reset();
  } catch (err) {
    // IPC failure during startup (e.g. module not yet registered) — clear to be safe
    console.error('[Auth Sync] Failed to sync with main process:', err);
    store.reset();
  }
}

async function startApp() {
  applyDocumentIcons({
    faviconHref: logoIco,
    appleTouchIconHref: logo128,
  });

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

  // ── Sync renderer auth state with main process ────────────────
  // Pinia persistence may hold stale tokens from a previous session.
  // Verify that the main process actually has a live session before
  // the router guard allows access to protected routes.
  await syncRendererAuthState();

  // Router (Hash mode for Electron file:// protocol)
  const router = createAppRouter({
    history: createWebHashHistory(),
    isAuthenticated: () => useAuthenticationStore().isAuthenticated,
    authView: DesktopAuthView,
    additionalTopLevelRoutes: [
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
