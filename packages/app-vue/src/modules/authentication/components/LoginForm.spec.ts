import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LoginForm from './LoginForm.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      auth: {
        login: {
          title: 'Sign in',
          description: 'Continue to your workspace.',
          tab: {
            email: 'Email',
            phone: 'Phone',
          },
          submit: 'Sign in',
          submitting: 'Signing in...',
          forgotPassword: 'Forgot password?',
          noAccount: 'No account yet?',
          registerLink: 'Register',
        },
        field: {
          email: 'Email',
          password: 'Password',
          phone: 'Phone',
          smsCode: 'SMS code',
        },
        placeholder: {
          password: 'Password',
          phone: 'Phone number',
          smsCode: '123456',
        },
        smsCode: {
          send: 'Send code',
          sending: 'Sending...',
          countdown: '{n}s',
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
  props: ['modelValue', 'type', 'placeholder', 'disabled', 'maxlength', 'id'],
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
        maxlength: props.maxlength,
        onInput: (event: Event) =>
          emit('update:modelValue', (event.target as HTMLInputElement).value),
      });
  },
});

const CheckboxStub = defineComponent({
  name: 'CheckboxStub',
  props: ['checked', 'disabled', 'id'],
  emits: ['update:checked'],
  setup(props, { attrs, emit }) {
    return () =>
      h('input', {
        ...attrs,
        id: props.id,
        type: 'checkbox',
        checked: props.checked,
        disabled: props.disabled,
        onChange: (event: Event) =>
          emit('update:checked', (event.target as HTMLInputElement).checked),
      });
  },
});

const DivStub = defineComponent({
  name: 'DivStub',
  setup(_, { attrs, slots }) {
    return () => h('div', attrs, slots.default?.());
  },
});

function mountForm() {
  return mount(LoginForm, {
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
        Card: DivStub,
        CardHeader: DivStub,
        CardTitle: DivStub,
        CardDescription: DivStub,
        CardContent: DivStub,
        CardFooter: DivStub,
        Tabs: DivStub,
        TabsContent: DivStub,
        TabsList: DivStub,
        TabsTrigger: ButtonStub,
      },
    },
  });
}

describe('LoginForm', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('submits a valid email login and keeps remember-password enabled for auto-login', async () => {
    const wrapper = mountForm();

    await wrapper.get('#email').setValue('user@example.com');
    await wrapper.get('#password').setValue('StrongPass1');
    await wrapper.get('#auto-login').setValue(true);
    await nextTick();

    expect((wrapper.get('#remember').element as HTMLInputElement).checked).toBe(true);

    await wrapper.get('#password').trigger('keyup.enter');

    expect(wrapper.emitted('loginByEmail')).toEqual([
      [
        {
          email: 'user@example.com',
          password: 'StrongPass1',
          rememberPassword: true,
          autoLogin: true,
        },
      ],
    ]);

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Forgot password?')
      ?.trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Register')
      ?.trigger('click');

    expect(wrapper.emitted('forgotPassword')).toEqual([[]]);
    expect(wrapper.emitted('register')).toEqual([[]]);
  });

  it('sends an SMS code countdown and submits phone login after the code is entered', async () => {
    vi.useFakeTimers();
    const wrapper = mountForm();

    await wrapper.get('#phone').setValue('13800138000');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Send code')
      ?.trigger('click');

    expect(wrapper.emitted('sendSmsCode')).toEqual([['13800138000']]);
    expect(wrapper.text()).toContain('60s');

    vi.advanceTimersByTime(1000);
    await nextTick();

    expect(wrapper.text()).toContain('59s');

    await wrapper.get('#code').setValue('123456');
    await wrapper.get('#code').trigger('keyup.enter');

    expect(wrapper.emitted('loginByPhone')).toEqual([
      [
        {
          phoneNumber: '13800138000',
          code: '123456',
        },
      ],
    ]);
  });
});
