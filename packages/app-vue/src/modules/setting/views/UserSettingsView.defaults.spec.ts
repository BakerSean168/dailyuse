import { defineComponent, h, type PropType } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fail, ok } from '@memoflow/contracts/result';
import type { Result } from '@memoflow/contracts/result';
import type { UserSettingClientDTO, UserSettingPreferences } from '@memoflow/contracts/setting';
import { createTestPinia } from '@memoflow/test-utils';
import { SETTING_SERVICE_KEY } from '../../../di/keys';
import { createI18nPlugin } from '../../../plugins/i18n';
import enUS from '../../../locales/en-US';
import { useUserSettingStore } from '../stores/user-setting-store';
import { usePresentationBootstrap } from '../composables/usePresentationBootstrap';
import UserSettingsView from './UserSettingsView.vue';

/**
 * W6 P1-2 page-level evidence: a brand-new user (no persisted setting record)
 * must eventually SEE the server defaults in the real settings page DOM, no
 * matter whether the concurrent root bootstrap / page load lands the defaults
 * before or after the settings record. The root bootstrap is the only caller
 * of getUserSettingDefaults, so these tests drive the real concurrency between
 * App-level bootstrap and UserSettingsView.onMounted.
 *
 * The appearance/region shadcn Select primitives are stubbed to render their
 * model value into the DOM (reka-ui only renders the selected label while the
 * dropdown is open, which would hide the value in a closed trigger). The page,
 * its store getters and the bootstrap composable are all real.
 */

const routerMocks = vi.hoisted(() => ({
  query: {} as Record<string, string>,
  replace: vi.fn(async () => undefined),
  resolve: vi.fn(() => ({ href: '/settings?tab=appearance' })),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: routerMocks.query }),
  useRouter: () => ({ replace: routerMocks.replace, resolve: routerMocks.resolve }),
}));

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createSetting(overrides: Partial<UserSettingClientDTO> = {}): UserSettingClientDTO {
  return {
    id: 'setting-1' as UserSettingClientDTO['id'],
    identityId: 'identity-1' as UserSettingClientDTO['identityId'],
    preferences: {
      appearance: { theme: 'dark' },
      locale: {
        language: 'en-US',
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24H',
        currency: 'USD',
        weekStartsOn: 1,
      },
      notification: {
        email: true,
        push: true,
        inApp: true,
        sound: true,
        useCustomNotification: false,
      },
    } as UserSettingPreferences,
    version: 1,
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  } as UserSettingClientDTO;
}

/** A fresh account whose settings record has no appearance preference yet. */
function createNewUserSetting(): UserSettingClientDTO {
  const setting = createSetting();
  delete (setting.preferences as Record<string, unknown>).appearance;
  return setting;
}

/** Server defaults carry a distinctive theme so the DOM can prove provenance. */
function createDefaults(): UserSettingClientDTO {
  return {
    id: 'setting-defaults' as UserSettingClientDTO['id'],
    identityId: 'identity-1' as UserSettingClientDTO['identityId'],
    preferences: {
      ...createSetting().preferences,
      appearance: { theme: 'dark' },
    } as UserSettingPreferences,
    version: 0,
    createdAt: 0,
    updatedAt: 0,
  } as UserSettingClientDTO;
}

const SelectStub = defineComponent({
  props: {
    modelValue: { type: [String, Number] as PropType<string | number>, default: undefined },
  },
  setup(props) {
    return () =>
      h(
        'div',
        {
          'data-testid': 'select-model-value',
          'data-value': props.modelValue == null ? '' : String(props.modelValue),
        },
        props.modelValue == null ? '' : String(props.modelValue),
      );
  },
});

const PassthroughStub = defineComponent({
  name: 'PassthroughStub',
  setup(_, { attrs, slots }) {
    return () => h('div', attrs, slots.default?.());
  },
});

interface MockService {
  getUserSettings: ReturnType<typeof vi.fn<() => Promise<Result<UserSettingClientDTO>>>>;
  getUserSettingDefaults: ReturnType<typeof vi.fn<() => Promise<Result<UserSettingClientDTO>>>>;
  patchCategory: ReturnType<typeof vi.fn>;
  resetUserSettings: ReturnType<typeof vi.fn>;
}

function createService(): MockService {
  return {
    getUserSettings: vi.fn(),
    getUserSettingDefaults: vi.fn(),
    patchCategory: vi.fn(),
    resetUserSettings: vi.fn(),
  };
}

let scheduledRootLoad: (() => void) | null = null;

function mountSettingsPage(service: MockService) {
  const pinia = createTestPinia();
  const i18n = createI18nPlugin('en-US', enUS as Record<string, unknown>);

  const wrapper = mount(
    defineComponent({
      name: 'RootHost',
      setup() {
        // App.vue / Desktop App.vue call the presentation bootstrap at the root.
        usePresentationBootstrap();
        return () => h(UserSettingsView);
      },
    }),
    {
      global: {
        plugins: [pinia, i18n],
        provide: {
          [SETTING_SERVICE_KEY as symbol]: service,
        },
        stubs: {
          Select: SelectStub,
          SelectTrigger: PassthroughStub,
          SelectContent: PassthroughStub,
          SelectItem: PassthroughStub,
          SelectValue: PassthroughStub,
          Card: PassthroughStub,
          CardContent: PassthroughStub,
          CardHeader: PassthroughStub,
          CardTitle: PassthroughStub,
          Label: PassthroughStub,
        },
      },
    },
  );

  return { wrapper, pinia, service };
}

function fireRootLoad() {
  const run = scheduledRootLoad;
  scheduledRootLoad = null;
  run?.();
}

function themeValue(wrapper: ReturnType<typeof mount>) {
  const card = wrapper.get('[data-testid="appearance-settings-card"]');
  const select = card.get('[data-testid="select-model-value"]');
  return select.attributes('data-value');
}

describe('UserSettingsView new-user defaults visibility (W6 P1-2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routerMocks.query = { tab: 'appearance' };
    scheduledRootLoad = null;
    // The root bootstrap schedules its load through setTimeout(0). Capture the
    // callback so the test can fire the root bootstrap at a controlled moment
    // while the page's own onMounted load is already in flight.
    vi.stubGlobal('setTimeout', vi.fn((fn: () => void) => {
      scheduledRootLoad = fn;
      return 1;
    }));
    vi.stubGlobal('clearTimeout', vi.fn());
    vi.stubGlobal('requestIdleCallback', undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the server defaults for a new user when defaults complete before the settings record', async () => {
    const settingsDeferred = deferred<Result<UserSettingClientDTO>>();
    const defaultsDeferred = deferred<Result<UserSettingClientDTO>>();
    const service = createService();
    service.getUserSettings.mockReturnValue(settingsDeferred.promise);
    service.getUserSettingDefaults.mockReturnValue(defaultsDeferred.promise);

    const { wrapper, pinia } = mountSettingsPage(service);
    fireRootLoad();

    // Defaults land first; the settings record has no appearance preference.
    defaultsDeferred.resolve(ok(createDefaults()));
    await flushPromises();
    settingsDeferred.resolve(ok(createNewUserSetting()));
    await flushPromises();

    const store = useUserSettingStore(pinia);
    expect(service.getUserSettingDefaults).toHaveBeenCalledTimes(1);
    expect(store.defaults).toEqual(createDefaults());
    expect(store.userSetting?.preferences?.appearance).toBeUndefined();
    // The visible appearance card shows the server default theme, not the
    // view's initial literal.
    expect(themeValue(wrapper)).toBe('dark');
    expect(wrapper.text()).toContain('Appearance Settings');
  });

  it('re-hydrates when defaults complete after the settings record so the new user still sees defaults', async () => {
    const settingsDeferred = deferred<Result<UserSettingClientDTO>>();
    const defaultsDeferred = deferred<Result<UserSettingClientDTO>>();
    const service = createService();
    service.getUserSettings.mockReturnValue(settingsDeferred.promise);
    service.getUserSettingDefaults.mockReturnValue(defaultsDeferred.promise);

    const { wrapper, pinia } = mountSettingsPage(service);
    fireRootLoad();

    // Settings resolve first, without defaults in the store yet.
    settingsDeferred.resolve(ok(createNewUserSetting()));
    await flushPromises();

    const store = useUserSettingStore(pinia);
    expect(store.defaults).toBeNull();
    // No defaults yet: the page falls back to its initial local literal.
    expect(themeValue(wrapper)).toBe('auto');

    // Defaults finally arrive — the page must re-hydrate and show them.
    defaultsDeferred.resolve(ok(createDefaults()));
    await flushPromises();

    expect(store.defaults).toEqual(createDefaults());
    expect(themeValue(wrapper)).toBe('dark');
  });

  it('keeps the settings page usable and shows the settings record when defaults fail', async () => {
    const settingsDeferred = deferred<Result<UserSettingClientDTO>>();
    const service = createService();
    service.getUserSettings.mockReturnValue(settingsDeferred.promise);
    service.getUserSettingDefaults.mockResolvedValue(
      fail({ code: 'SERVICE_UNAVAILABLE', message: 'down' }),
    );

    const { wrapper, pinia } = mountSettingsPage(service);
    fireRootLoad();
    settingsDeferred.resolve(ok(createSetting()));
    await flushPromises();

    const store = useUserSettingStore(pinia);
    // Defaults failure is best-effort: it must not surface an error.
    expect(store.defaults).toBeNull();
    expect(store.error).toBeNull();
    // The page still renders the loaded settings record.
    expect(themeValue(wrapper)).toBe('dark');
    expect(store.userSetting?.preferences?.appearance?.theme).toBe('dark');
  });

  it('renders the settings page with the initial values when the settings load fails', async () => {
    const settingsDeferred = deferred<Result<UserSettingClientDTO>>();
    const service = createService();
    service.getUserSettings.mockReturnValue(settingsDeferred.promise);
    service.getUserSettingDefaults.mockResolvedValue(ok(createDefaults()));

    const { wrapper, pinia } = mountSettingsPage(service);
    fireRootLoad();
    settingsDeferred.resolve(
      fail({ code: 'SERVICE_UNAVAILABLE', message: 'down' }),
    );
    await flushPromises();

    const store = useUserSettingStore(pinia);
    // The settings failure surfaces the translated error in the store.
    expect(store.error).toContain('temporarily unavailable');
    // The page is not stuck on the loading spinner; it renders content.
    expect(wrapper.find('[data-testid="appearance-settings-card"]').exists()).toBe(true);
    // Defaults still succeeded, so a new user sees the server defaults even
    // though the settings record itself failed to load.
    expect(themeValue(wrapper)).toBe('dark');
  });
});
