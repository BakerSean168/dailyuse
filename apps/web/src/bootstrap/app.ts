import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createWebHistory } from 'vue-router';
import { APP_TITLE_NAME } from '@dailyuse/assets';
import {
  createAppRouter,
  useAuthenticationStore,
  applyThemeMode,
  usePresentationPreferenceStore,
} from '@dailyuse/app-vue/web-bootstrap';
import { createI18nPlugin, loadLocaleMessages } from '@dailyuse/app-vue/web-i18n';
import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { progressStart, progressDone } from '@dailyuse/ui-vue-shadcn/composables/useProgressBar';

import App from '../App.vue';
import { installAppServices } from '../platform/di-app';

export async function bootstrapMainApp() {
  const app = createApp(App);

  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
  app.use(pinia);

  const presentationStore = usePresentationPreferenceStore();
  applyThemeMode(presentationStore.theme);
  document.documentElement.lang = presentationStore.locale;

  const localeMessages = await loadLocaleMessages(presentationStore.locale);
  app.use(createI18nPlugin(presentationStore.locale, localeMessages));

  const router = createAppRouter({
    history: createWebHistory(),
    isAuthenticated: () => useAuthenticationStore().isAuthenticated,
  });
  router.beforeEach(() => progressStart());
  router.afterEach((to) => {
    progressDone();
    const title = to.meta.title as string | undefined;
    document.title = title ? `${title} - ${APP_TITLE_NAME}` : APP_TITLE_NAME;
  });
  app.use(router);

  app.use(installAppServices);
  app.mount('#app');

  const runStartupPhase = async () => {
    const { registerNotificationInitializationTasks } =
      await import('@dailyuse/app-vue/web-notification');
    registerNotificationInitializationTasks();

    await InitializationManager.getInstance()
      .executePhase(InitializationPhase.APP_STARTUP)
      .catch((error) => {
        console.error('[web] APP_STARTUP phase failed', error);
      });
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(runStartupPhase, { timeout: 3000 });
  } else {
    globalThis.setTimeout(runStartupPhase, 0);
  }
}
