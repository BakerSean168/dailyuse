import { defineComponent, h, nextTick } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import DesktopAuthView from './DesktopAuthView.vue';

const authMocks = vi.hoisted(() => ({
  loginByEmail: vi.fn(async () => true),
  registerByEmail: vi.fn(async () => true),
  enterGuestMode: vi.fn(async () => true),
  autoLoginDesktop: vi.fn(async () => ({ authenticated: false })),
  listRememberedAccounts: vi.fn(async () => []),
  loginRememberedDesktopAccount: vi.fn(async () => true),
  removeRememberedAccount: vi.fn(async () => true),
  isLoading: { value: false },
  resultError: { value: null },
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ path: '/auth/login', query: {} }),
}));

vi.mock('vue-sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('../modules/authentication/composables/useAuth', async () => {
  const vue = await import('vue');
  return {
    useAuth: () => ({
      ...authMocks,
      isLoading: vue.computed(() => false),
      resultError: vue.ref(null),
    }),
  };
});

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      auth: {
        login: {
          submit: 'Sign in',
          submitting: 'Signing in...',
        },
        register: {
          submit: 'Create account',
          submitting: 'Creating...',
        },
        toast: {
          loginFailed: 'Login failed',
        },
        validation: {
          passwordMismatch: 'Passwords do not match',
          loginCredentialsRequired: 'Email and password are required',
          registerFieldsRequired: 'All fields are required',
        },
        desktop: {
          autoLogin: 'Auto login',
        },
      },
    },
  },
});

const ButtonStub = defineComponent({
  name: 'ButtonStub',
  props: ['disabled', 'variant', 'size', 'asChild'],
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
  emits: ['update:modelValue', 'focus', 'keyup'],
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
        onFocus: () => emit('focus'),
      });
  },
});

const CheckboxStub = defineComponent({
  name: 'CheckboxStub',
  props: ['modelValue', 'disabled', 'id'],
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    return () =>
      h('input', {
        ...attrs,
        id: props.id,
        type: 'checkbox',
        checked: props.modelValue,
        disabled: props.disabled,
        onChange: (event: Event) =>
          emit('update:modelValue', (event.target as HTMLInputElement).checked),
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
  return mount(DesktopAuthView, {
    global: {
      plugins: [i18n],
      stubs: {
        Button: ButtonStub,
        Input: InputStub,
        Label: defineComponent({
          name: 'LabelStub',
          setup(_, { attrs, slots }) {
            return () => h('label', attrs, slots.default?.());
          },
        }),
        Checkbox: CheckboxStub,
        ScrollArea: PassthroughStub,
        DropdownMenu: PassthroughStub,
        DropdownMenuContent: PassthroughStub,
        DropdownMenuItem: PassthroughStub,
        DropdownMenuTrigger: PassthroughStub,
        Popover: PassthroughStub,
        PopoverContent: PassthroughStub,
        PopoverTrigger: PassthroughStub,
        Dialog: PassthroughStub,
        DialogContent: PassthroughStub,
        DialogHeader: PassthroughStub,
        DialogTitle: PassthroughStub,
        DialogDescription: PassthroughStub,
        DialogFooter: PassthroughStub,
        UserRound: true,
        Trash2: true,
        ChevronDown: true,
        Menu: true,
        Loader2: true,
        Plus: true,
        X: true,
        Mail: true,
        Lock: true,
        EyeOff: true,
        Eye: true,
      },
    },
  });
}

describe('DesktopAuthView three-login surface contract', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('exposes password login and guest mode without GitHub OAuth entry', async () => {
    const wrapper = mountView();
    await flushPromises();
    await nextTick();

    expect(authMocks.listRememberedAccounts).toHaveBeenCalled();
    expect(wrapper.find('[data-testid="desktop-login-email"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="desktop-login-password"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="login-submit-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="guest-mode-button"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="login-github-button"]').exists()).toBe(false);
    expect(wrapper.text()).not.toMatch(/Continue with GitHub|使用 GitHub|GitHub/i);

    wrapper.unmount();
  });

  it('enters guest mode from the dedicated desktop entry', async () => {
    const wrapper = mountView();
    await flushPromises();

    await wrapper.get('[data-testid="guest-mode-button"]').trigger('click');
    await flushPromises();

    expect(authMocks.enterGuestMode).toHaveBeenCalledTimes(1);
    expect(authMocks.loginByEmail).not.toHaveBeenCalled();

    wrapper.unmount();
  });
});
