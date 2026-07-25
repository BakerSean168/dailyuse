import { defineComponent, h, nextTick } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WebAuthView from './WebAuthView.vue';
import { createAuthI18n } from './i18n';

const webAuthMocks = vi.hoisted(() => ({
  loginByEmail: vi.fn(async () => true as const),
  registerByEmail: vi.fn(async () => true as const),
  forgotPassword: vi.fn(async () => true),
  resetPassword: vi.fn(async () => true),
  sendEmailCode: vi.fn(async () => true),
  verifyEmailCode: vi.fn(async () => true),
  completeGithubOAuth: vi.fn(async () => true),
  startGithubLogin: vi.fn(async () => true),
  probeGithubAvailability: vi.fn(async () => true),
  clearError: vi.fn(),
  clearSuccessMessage: vi.fn(),
}));

vi.mock('./useWebAuth', async () => {
  const vue = await import('vue');
  return {
    useWebAuth: () => ({
      loginByEmail: webAuthMocks.loginByEmail,
      registerByEmail: webAuthMocks.registerByEmail,
      forgotPassword: webAuthMocks.forgotPassword,
      resetPassword: webAuthMocks.resetPassword,
      sendEmailCode: webAuthMocks.sendEmailCode,
      verifyEmailCode: webAuthMocks.verifyEmailCode,
      completeGithubOAuth: webAuthMocks.completeGithubOAuth,
      startGithubLogin: webAuthMocks.startGithubLogin,
      probeGithubAvailability: webAuthMocks.probeGithubAvailability,
      clearError: webAuthMocks.clearError,
      clearSuccessMessage: webAuthMocks.clearSuccessMessage,
      // Real refs so template auto-unwrap treats loading as boolean false.
      isLoading: vue.ref(false),
      error: vue.ref(null),
      errorMessage: vue.ref(null),
      successMessage: vue.ref(null),
      pendingVerificationEmail: vue.ref(null),
    }),
  };
});

const ButtonStub = defineComponent({
  name: 'ButtonStub',
  props: ['disabled', 'variant', 'size', 'type'],
  setup(props, { attrs, slots }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          type: props.type ?? 'button',
          disabled: props.disabled,
        },
        slots.default?.(),
      );
  },
});

const InputStub = defineComponent({
  name: 'InputStub',
  props: [
    'modelValue',
    'type',
    'placeholder',
    'disabled',
    'id',
    'autocomplete',
    'ariaInvalid',
    'ariaDescribedby',
  ],
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
        autocomplete: props.autocomplete,
        'aria-invalid': props.ariaInvalid,
        'aria-describedby': props.ariaDescribedby,
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
  return mount(WebAuthView, {
    global: {
      plugins: [createAuthI18n('en-US')],
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
        Loader2: true,
      },
    },
  });
}

describe('WebAuthView three-login surface contract', () => {
  beforeEach(() => {
    webAuthMocks.probeGithubAvailability.mockReset();
    webAuthMocks.startGithubLogin.mockReset();
    webAuthMocks.loginByEmail.mockReset();
    webAuthMocks.probeGithubAvailability.mockResolvedValue(true);
    webAuthMocks.startGithubLogin.mockResolvedValue(true);
    webAuthMocks.loginByEmail.mockResolvedValue(true as const);
    window.history.replaceState({}, '', '/auth');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('exposes password login and GitHub OAuth without guest mode', async () => {
    const wrapper = mountView();
    await flushPromises();
    await nextTick();

    expect(webAuthMocks.probeGithubAvailability).toHaveBeenCalled();
    expect(wrapper.find('[data-testid="login-form"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="login-username-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="login-password-input"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="login-submit-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="login-github-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="guest-mode-button"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="login-phone-input"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="send-sms-code-button"]').exists()).toBe(false);

    wrapper.unmount();
  });

  it('hides the GitHub entry when OAuth is unavailable', async () => {
    webAuthMocks.probeGithubAvailability.mockResolvedValueOnce(false);
    const wrapper = mountView();
    await flushPromises();
    await nextTick();

    expect(wrapper.find('[data-testid="login-submit-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="login-github-button"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="guest-mode-button"]').exists()).toBe(false);

    wrapper.unmount();
  });

  it('starts GitHub login only through the dedicated OAuth entry', async () => {
    const wrapper = mountView();
    await flushPromises();
    await nextTick();

    expect(wrapper.find('[data-testid="login-github-button"]').exists()).toBe(true);
    await wrapper.get('[data-testid="login-github-button"]').trigger('click');
    await flushPromises();

    expect(webAuthMocks.startGithubLogin).toHaveBeenCalledWith(
      expect.stringMatching(/\/auth$/),
    );
    expect(webAuthMocks.loginByEmail).not.toHaveBeenCalled();

    wrapper.unmount();
  });
});
