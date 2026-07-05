import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  };
  const notificationHook = {
    start: vi.fn(),
  };

  return {
    app,
    pinia,
    router,
    notificationHook,
    createApp: vi.fn(() => app),
    createPinia: vi.fn(() => pinia),
    createAppRouter: vi.fn(() => router),
    useAuthenticationStore: vi.fn(() => ({ isAuthenticated: false })),
    usePresentationPreferenceStore: vi.fn(() => ({ theme: 'dark', locale: 'zh-CN' })),
    applyThemeMode: vi.fn(),
    createNotificationStartupHook: vi.fn(() => notificationHook),
    createI18nPlugin: vi.fn(() => ({ name: 'i18n-plugin' })),
    loadLocaleMessages: vi.fn(async () => ({ hello: 'world' })),
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

vi.mock('@dailyuse/app-vue/web-bootstrap', () => ({
  createAppRouter: mocks.createAppRouter,
  useAuthenticationStore: mocks.useAuthenticationStore,
  applyThemeMode: mocks.applyThemeMode,
  usePresentationPreferenceStore: mocks.usePresentationPreferenceStore,
}));

vi.mock('@dailyuse/app-vue', () => ({
  createNotificationStartupHook: mocks.createNotificationStartupHook,
}));

vi.mock('@dailyuse/app-vue/web-i18n', () => ({
  createI18nPlugin: mocks.createI18nPlugin,
  loadLocaleMessages: mocks.loadLocaleMessages,
}));

vi.mock('@dailyuse/ui-vue-shadcn/composables/useProgressBar', () => ({
  progressStart: mocks.progressStart,
  progressDone: mocks.progressDone,
}));

vi.mock('../App.vue', () => ({
  default: { name: 'WebAppRoot' },
}));

vi.mock('../platform/di-app', () => ({
  installAppServices: { name: 'install-app-services' },
}));

describe('bootstrapMainApp', () => {
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
    });
    Object.assign(mocks.notificationHook, {
      start: vi.fn(),
    });
    document.documentElement.lang = '';
    document.title = '';
    Object.defineProperty(window, 'requestIdleCallback', {
      configurable: true,
      value: mocks.requestIdleCallback,
    });
  });

  afterEach(() => {
    delete (window as Window & { requestIdleCallback?: IdleRequestCallback }).requestIdleCallback;
  });

  it('bootstraps the web app and schedules startup hooks through requestIdleCallback', async () => {
    const { bootstrapMainApp } = await import('./app');

    await bootstrapMainApp();

    expect(mocks.createApp).toHaveBeenCalledTimes(1);
    expect(mocks.createPinia).toHaveBeenCalledTimes(1);
    expect(mocks.pinia.use).toHaveBeenCalledWith('persisted-plugin');
    expect(mocks.applyThemeMode).toHaveBeenCalledWith('dark');
    expect(document.documentElement.lang).toBe('zh-CN');
    expect(mocks.loadLocaleMessages).toHaveBeenCalledWith('zh-CN');
    expect(mocks.createI18nPlugin).toHaveBeenCalledWith('zh-CN', { hello: 'world' });
    expect(mocks.createAppRouter).toHaveBeenCalledTimes(1);
    expect(mocks.app.mount).toHaveBeenCalledWith('#app');
    expect(mocks.requestIdleCallback).toHaveBeenCalledTimes(1);
    expect(mocks.notificationHook.start).toHaveBeenCalledTimes(1);

    const afterEachHandler = mocks.router.afterEach.mock.calls[0]?.[0];
    expect(afterEachHandler).toBeTypeOf('function');
    afterEachHandler({ meta: { title: 'Inbox' } });

    expect(mocks.progressDone).toHaveBeenCalledTimes(1);
    expect(document.title).toBe('Inbox - Dailyuse');
  });
});
