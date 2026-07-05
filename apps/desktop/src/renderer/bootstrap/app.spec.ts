// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const app = {
    use: vi.fn(),
    mount: vi.fn(),
  };
  const pinia = {
    use: vi.fn(),
  };
  const router = {
    beforeEach: vi.fn(),
    afterEach: vi.fn(),
    isReady: vi.fn(async () => undefined),
    replace: vi.fn(),
    currentRoute: {
      value: { name: 'home' },
    },
  };
  const authStore = {
    isAuthenticated: true,
    reset: vi.fn(),
  };
  const notificationHook = {
    start: vi.fn(),
  };

  return {
    app,
    pinia,
    router,
    authStore,
    notificationHook,
    createApp: vi.fn(() => app),
    createPinia: vi.fn(() => pinia),
    createAppRouter: vi.fn(() => router),
    useAuthenticationStore: vi.fn(() => authStore),
    usePresentationPreferenceStore: vi.fn(() => ({ locale: 'en-US' })),
    createI18nPlugin: vi.fn(() => ({ name: 'desktop-i18n-plugin' })),
    loadLocaleMessages: vi.fn(async () => ({ hello: 'desktop' })),
    translateMessageKey: vi.fn((key: string) => (key === 'dashboard.title' ? 'Dashboard' : key)),
    hydrateDesktopBootstrapAuthState: vi.fn(async () => true),
    createNotificationStartupHook: vi.fn(() => notificationHook),
    initElectronFeatures: vi.fn(),
    shouldRedirectAuthenticatedDesktopEntry: vi.fn(() => true),
    progressStart: vi.fn(),
    progressDone: vi.fn(),
    requestIdleCallback: vi.fn((cb: IdleRequestCallback) => {
      cb({
        didTimeout: false,
        timeRemaining: () => 0,
      } as IdleDeadline);
      return 1;
    }),
  };
});

vi.mock('vue', () => ({
  createApp: mocks.createApp,
}));

vi.mock('pinia', () => ({
  createPinia: mocks.createPinia,
}));

vi.mock('pinia-plugin-persistedstate', () => ({
  default: 'persisted-plugin',
}));

vi.mock('@dailyuse/assets', () => ({
  APP_TITLE_NAME: 'Dailyuse',
}));

vi.mock('@dailyuse/app-vue/router', () => ({
  createAppRouter: mocks.createAppRouter,
}));

vi.mock('@dailyuse/app-vue/modules/authentication', () => ({
  useAuthenticationStore: mocks.useAuthenticationStore,
}));

vi.mock('@dailyuse/app-vue/plugins/i18n', () => ({
  createI18nPlugin: mocks.createI18nPlugin,
  loadLocaleMessages: mocks.loadLocaleMessages,
  translateMessageKey: mocks.translateMessageKey,
}));

vi.mock('@dailyuse/app-vue/desktop', () => ({
  DesktopAuthView: { name: 'DesktopAuthView' },
  hydrateDesktopBootstrapAuthState: mocks.hydrateDesktopBootstrapAuthState,
}));

vi.mock('@dailyuse/app-vue/modules/notification', () => ({
  createNotificationStartupHook: mocks.createNotificationStartupHook,
}));

vi.mock('@dailyuse/app-vue/modules/setting', () => ({
  usePresentationPreferenceStore: mocks.usePresentationPreferenceStore,
}));

vi.mock('@dailyuse/ui-vue-shadcn/composables/useProgressBar', () => ({
  progressStart: mocks.progressStart,
  progressDone: mocks.progressDone,
}));

vi.mock('../App.vue', () => ({
  default: { name: 'DesktopAppRoot' },
}));

vi.mock('../CustomNotificationView.vue', () => ({
  default: { name: 'CustomNotificationView' },
}));

vi.mock('../platform/di-app', () => ({
  installDesktopAppServices: { name: 'install-desktop-app-services' },
}));

vi.mock('../platform/electron', () => ({
  initElectronFeatures: mocks.initElectronFeatures,
}));

vi.mock('./route-entry', () => ({
  shouldRedirectAuthenticatedDesktopEntry: mocks.shouldRedirectAuthenticatedDesktopEntry,
}));

describe('desktop bootstrapMainApp', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    Object.assign(mocks.app, {
      use: vi.fn(),
      mount: vi.fn(),
    });
    Object.assign(mocks.pinia, {
      use: vi.fn(),
    });
    Object.assign(mocks.router, {
      beforeEach: vi.fn(),
      afterEach: vi.fn(),
      isReady: vi.fn(async () => undefined),
      replace: vi.fn(),
      currentRoute: {
        value: { name: 'home' },
      },
    });
    Object.assign(mocks.authStore, {
      isAuthenticated: true,
      reset: vi.fn(),
    });
    Object.assign(mocks.notificationHook, {
      start: vi.fn(),
    });
    document.documentElement.lang = '';
    document.title = '';
    (window as Window & { electronAPI?: object }).electronAPI = { ping: 'pong' };
    Object.defineProperty(window, 'requestIdleCallback', {
      configurable: true,
      value: mocks.requestIdleCallback,
    });
  });

  it('bootstraps the desktop renderer and redirects authenticated entrypoints after router readiness', async () => {
    const { bootstrapMainApp } = await import('./app');

    await bootstrapMainApp();
    await Promise.resolve();
    await Promise.resolve();

    expect(mocks.hydrateDesktopBootstrapAuthState).toHaveBeenCalledWith(window.electronAPI);
    expect(document.documentElement.lang).toBe('en-US');
    expect(mocks.createAppRouter).toHaveBeenCalledTimes(1);
    expect(mocks.initElectronFeatures).toHaveBeenCalledWith(mocks.app);
    expect(mocks.app.mount).toHaveBeenCalledWith('#app');
    expect(mocks.notificationHook.start).toHaveBeenCalledTimes(1);
    expect(mocks.router.replace).toHaveBeenCalledWith('/');

    const afterEachHandler = mocks.router.afterEach.mock.calls[0]?.[0];
    expect(afterEachHandler).toBeTypeOf('function');
    afterEachHandler({ meta: { title: 'dashboard.title' } });
    expect(document.title).toBe('Dashboard - Dailyuse');

    afterEachHandler({ meta: { title: 'Desktop Home' } });

    expect(mocks.progressDone).toHaveBeenCalledTimes(2);
    expect(document.title).toBe('Desktop Home - Dailyuse');
  });

  it('resets auth state when desktop auth hydration fails', async () => {
    mocks.hydrateDesktopBootstrapAuthState.mockRejectedValueOnce(new Error('boom'));

    const { bootstrapMainApp } = await import('./app');

    await bootstrapMainApp();
    await Promise.resolve();
    await Promise.resolve();

    expect(mocks.authStore.reset).toHaveBeenCalledTimes(1);
    expect(mocks.router.replace).not.toHaveBeenCalled();
  });
});


