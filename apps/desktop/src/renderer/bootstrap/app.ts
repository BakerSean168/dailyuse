import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createWebHashHistory } from 'vue-router';
import { APP_TITLE_NAME } from '@dailyuse/assets';
import {
  createAppRouter,
  useAuthenticationStore,
  createI18nPlugin,
  loadLocaleMessages,
  DesktopAuthView,
  hydrateDesktopBootstrapAuthState,
  registerNotificationInitializationTasks,
  usePresentationPreferenceStore,
} from '@dailyuse/app-vue';
import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { progressStart, progressDone } from '@dailyuse/ui-vue-shadcn/composables/useProgressBar';

import App from '../App.vue';
import { installDesktopAppServices } from '../platform/di-app';
import { initElectronFeatures } from '../platform/electron';
import { shouldRedirectAuthenticatedDesktopEntry } from './route-entry';

async function hydrateRendererAuthState(): Promise<boolean> {
  try {
    return await hydrateDesktopBootstrapAuthState(window.electronAPI);
  } catch (err) {
    console.error('[Auth Sync] Failed to hydrate desktop auth snapshot:', err);
    useAuthenticationStore().reset();
    return false;
  }
}

export async function bootstrapMainApp() {
  const app = createApp(App);

  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
  app.use(pinia);

  const presentationStore = usePresentationPreferenceStore();
  document.documentElement.lang = presentationStore.locale;

  const localeMessages = await loadLocaleMessages(presentationStore.locale);
  app.use(createI18nPlugin(presentationStore.locale, localeMessages));

  const hasDesktopAuthSnapshot = await hydrateRendererAuthState();

  const router = createAppRouter({
    history: createWebHashHistory(),
    isAuthenticated: () => useAuthenticationStore().isAuthenticated,
    authView: DesktopAuthView,
    additionalTopLevelRoutes: [
      {
        path: '/custom-notification',
        name: 'custom-notification',
        component: () => import('../CustomNotificationView.vue'),
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
    document.title = title ? `${title} - ${APP_TITLE_NAME}` : APP_TITLE_NAME;
  });

  app.use(router);
  app.use(installDesktopAppServices);
  initElectronFeatures(app);
  app.mount('#app');

  const runStartupPhase = async () => {
    try {
      registerNotificationInitializationTasks();

      await InitializationManager.getInstance().executePhase(InitializationPhase.APP_STARTUP);
    } catch (error) {
      console.error('[desktop] APP_STARTUP phase failed', error);
    }
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(runStartupPhase, { timeout: 3000 });
  } else {
    globalThis.setTimeout(runStartupPhase, 0);
  }

  void router.isReady().then(() => {
    if (!hasDesktopAuthSnapshot || !useAuthenticationStore().isAuthenticated) {
      return;
    }

    if (!shouldRedirectAuthenticatedDesktopEntry(router.currentRoute.value.name)) {
      return;
    }

    void router.replace('/');
  });
}
