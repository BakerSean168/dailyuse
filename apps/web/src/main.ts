/**
 * Web App Entry Point (精简版)
 *
 * 仅注册：Vue 3 + Pinia + Router + Tailwind CSS + Module DI
 */

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './router';
import { installModuleServices } from './shared/di';
import './styles/index.css';

// Polyfill crypto.randomUUID for non-secure contexts or older browsers
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  crypto.randomUUID = () => {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
      (
        c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
      ).toString(16),
    ) as `${string}-${string}-${string}-${string}-${string}`;
  };
}

async function startApp() {
  // Enable MSW mock service worker in development when VITE_ENABLE_MOCK_API=true
  if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_API === 'true') {
    const { worker } = await import('./mocks/browser');
    await worker.start({
      // Let unmatched requests pass through to the real server (or proxy)
      onUnhandledRequest: 'bypass',
    });
  }

  const app = createApp(App);
  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);

  app.use(pinia);
  app.use(router);

  // 注入模块服务（AccountClientService、AuthClientService、IRuleApiClient）
  app.use(installModuleServices);

  app.mount('#app');
}

startApp();
