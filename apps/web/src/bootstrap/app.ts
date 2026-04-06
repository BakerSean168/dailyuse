import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createWebHistory } from 'vue-router';
import { APP_TITLE_NAME } from '@dailyuse/assets';
import {
  createAppRouter,
  useAuthenticationStore,
  createI18nPlugin,
  registerNotificationInitializationTasks,
  applyThemeMode,
  usePresentationPreferenceStore,
} from '@dailyuse/app-vue';
import { InitializationManager, InitializationPhase } from '@dailyuse/utils';
import { progressStart, progressDone } from '@dailyuse/ui-vue-shadcn';

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

  app.use(createI18nPlugin(presentationStore.locale));

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

  registerNotificationInitializationTasks();
  void InitializationManager.getInstance().executePhase(InitializationPhase.APP_STARTUP);
}
