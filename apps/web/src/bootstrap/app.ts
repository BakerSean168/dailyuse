import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import { createWebHistory } from 'vue-router';
import { APP_TITLE_NAME } from '@memoflow/assets';
import {
  createAppRouter,
  useAuthenticationStore,
  applyThemeMode,
  usePresentationPreferenceStore,
} from '@memoflow/app-vue/web-bootstrap';
import {
  createNotificationStartupHook,
  createNotificationSseInvalidationSource,
} from '@memoflow/app-vue';
import { createI18nPlugin, loadLocaleMessages, translateMessageKey } from '@memoflow/app-vue/web-i18n';
import { progressStart, progressDone } from '@memoflow/ui-vue-shadcn/composables/useProgressBar';

import App from '../App.vue';
import { installAppServices } from '../platform/di-app';
import {
  getWebServerStateRuntime,
  installWebServerStateRuntime,
  registerWebServerStateSource,
} from '../platform/server-state';
import { createCloudAuthHttpClient } from '@memoflow/cloud-auth';

export async function bootstrapMainApp() {
  const app = createApp(App);

  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
  app.use(pinia);

  const authStore = useAuthenticationStore();
  authStore.setIsInitializing(true);
  const cloudSession = await createCloudAuthHttpClient(undefined, {
    baseUrl: window.location.origin,
  }).getSession();
  if (cloudSession.ok) {
    authStore.hydrateCloudSession(cloudSession.data);
    // 认证完成并取得 identity 后创建/安装 server-state runtime（§3.1：每个 renderer 恰好一个）。
    installWebServerStateRuntime(app);
  } else {
    authStore.reset();
    window.location.replace('/auth');
    return;
  }

  const presentationStore = usePresentationPreferenceStore();
  applyThemeMode(presentationStore.theme);
  document.documentElement.lang = presentationStore.locale;

  const localeMessages = await loadLocaleMessages(presentationStore.locale);
  app.use(createI18nPlugin(presentationStore.locale, localeMessages));

  const router = createAppRouter({
    history: createWebHistory(),
    canAccessApp: () => authStore.isAuthenticated,
  });
  router.beforeEach(() => progressStart());
  router.afterEach((to) => {
    progressDone();
    const titleKey = to.meta.title as string | undefined;
    const title = titleKey ? translateMessageKey(titleKey) : undefined;
    document.title = title ? `${title} - ${APP_TITLE_NAME}` : APP_TITLE_NAME;
  });
  app.use(router);

  app.use(installAppServices);
  app.mount('#app');

  // Startup hooks — explicit composition, no global phase registry
  // 实时源只向 dispatcher 发 invalidation intent（Step 3）；Web 额外启用 SSE 源，Desktop 不启用。
  const runStartupPhase = () => {
    const runtime = getWebServerStateRuntime();
    if (!runtime) return;
    const identityScope = () => authStore.getIdentityId ?? '';
    const notificationHook = createNotificationStartupHook({
      dispatcher: runtime.dispatcher,
      identityScope,
    });
    notificationHook.start();
    registerWebServerStateSource(notificationHook);

    const sseCursorKey = 'memoflow:notifications:sse-cursor';
    const sseSource = createNotificationSseInvalidationSource({
      dispatcher: runtime.dispatcher,
      identityScope,
      url: `${window.location.origin}/api/v1/notifications/sse`,
      cursorStore: {
        get: () => {
          try {
            return localStorage.getItem(sseCursorKey) ?? undefined;
          } catch {
            return undefined;
          }
        },
        set: (cursor) => {
          try {
            localStorage.setItem(sseCursorKey, cursor);
          } catch {
            // Best-effort cursor persistence.
          }
        },
      },
    });
    sseSource.start();
    registerWebServerStateSource(sseSource);
  };

  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(runStartupPhase, { timeout: 3000 });
  } else {
    globalThis.setTimeout(runStartupPhase, 0);
  }
}
