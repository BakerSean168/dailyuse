import { defineComponent, h, nextTick } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestPinia } from '@dailyuse/test-utils';
import AuthView from './AuthView.vue';

const authMocks = vi.hoisted(() => ({
  loginByEmail: vi.fn(async () => true),
  registerByEmail: vi.fn(async () => true),
  enterGuestMode: vi.fn(async () => true),
  isLoading: { value: false },
  error: { value: null },
}));

const desktopEnv = vi.hoisted(() => ({
  isDesktop: false,
}));

vi.mock('vue-sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('../modules/authentication/composables/useAuth', () => ({
  useAuth: () => ({
    ...authMocks,
    isLoading: authMocks.isLoading,
    error: authMocks.error,
  }),
}));

vi.mock('../modules/authentication/composables/useAuthContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../modules/authentication/composables/useAuthContext')>();
  return {
    ...actual,
    isDesktopEnvironment: () => desktopEnv.isDesktop,
  };
});

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      auth: {
        page: {
          guestMode: 'Guest Mode',
          guestLoading: 'Starting guest...',
          emailPlaceholder: 'Email',
          legalNoticePrefix: 'By continuing you agree to the',
          legalNoticeMid: 'and',
          legalNoticeSuffix: '.',
          termsOfService: 'Terms',
          privacyPolicy: 'Privacy',
          locales: { zhCN: '中文', enUS: 'EN' },
          themes: { auto: 'Auto', light: 'Light', dark: 'Dark' },
        },
        login: {
          submit: 'Sign in',
          submitting: 'Signing in...',
          registerLink: 'Register',
        },
        register: {
          submit: 'Create account',
          submitting: 'Creating...',
          loginLink: 'Back to login',
        },
        field: {
          email: 'Email',
          password: 'Password',
          confirmPassword: 'Confirm password',
        },
        toast: {
          loginFailed: 'Login failed',
          registerFailed: 'Register failed',
        },
        validation: {
          loginCredentialsRequired: 'Email and password required',
          registerFieldsRequired: 'All fields required',
          passwordMismatch: 'Passwords do not match',
        },
      },
    },
  },
});

const ButtonStub = defineComponent({
  name: 'ButtonStub',
  props: ['disabled', 'variant', 'size'],
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          type: 'button',
          disabled: props.disabled,
        },
        slots.default?.(),
      );
  },
});

const InputStub = defineComponent({
  name: 'InputStub',
  props: ['modelValue', 'type', 'placeholder', 'disabled', 'id'],
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    return () =>
      h('input', {
        ...attrs,
        id: props.id,
        type: props.type ?? 'text',
        value: props.modelValue ?? '',
        placeholder: props.placeholder,
        disabled: props.disabled,
        onInput: (event: Event) =>
          emit('update:modelValue', (event.target as HTMLInputElement).value),
      });
  },
});

const PassthroughStub = defineComponent({
  name: 'PassthroughStub',
  setup(_, { attrs, slots }) {
    return () => h('div', attrs, slots.default?.());
  },
});

function mountView() {
  const pinia = createTestPinia();
  return mount(AuthView, {
    global: {
      plugins: [pinia, i18n],
      stubs: {
        Button: ButtonStub,
        Input: InputStub,
        Label: defineComponent({
          name: 'LabelStub',
          setup(_, { attrs, slots }) {
            return () => h('label', attrs, slots.default?.());
          },
        }),
        Card: PassthroughStub,
        CardContent: PassthroughStub,
        CardFooter: PassthroughStub,
        Loader2: true,
      },
    },
  });
}

describe('AuthView platform auth surface', () => {
  afterEach(() => {
    desktopEnv.isDesktop = false;
    vi.clearAllMocks();
  });

  it('hides guest mode on web so GitHub/password AuthApp remains the only web entry', async () => {
    desktopEnv.isDesktop = false;
    const wrapper = mountView();
    await flushPromises();
    await nextTick();

    expect(wrapper.find('[data-testid="login-submit-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="guest-mode-button"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="login-github-button"]').exists()).toBe(false);

    wrapper.unmount();
  });

  it('exposes guest mode only when running as desktop', async () => {
    desktopEnv.isDesktop = true;
    const wrapper = mountView();
    await flushPromises();
    await nextTick();

    expect(wrapper.find('[data-testid="guest-mode-button"]').exists()).toBe(true);

    wrapper.unmount();
  });
});
