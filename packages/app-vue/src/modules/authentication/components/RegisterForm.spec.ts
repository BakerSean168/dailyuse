import { defineComponent, h, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RegisterForm from './RegisterForm.vue';

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      auth: {
        register: {
          title: 'Create account',
          description: 'Set up a new workspace identity.',
          tab: {
            email: 'Email',
            phone: 'Phone',
          },
          submit: 'Create account',
          submitting: 'Creating...',
          loginLink: 'Sign in',
          hasAccount: 'Already have an account?',
          passwordPlaceholder: 'Choose a password',
          confirmPasswordPlaceholder: 'Confirm password',
          passwordStrength: {
            weak: 'Weak',
            medium: 'Medium',
            strong: 'Strong',
          },
        },
        field: {
          email: 'Email',
          password: 'Password',
          confirmPassword: 'Confirm password',
          phone: 'Phone',
          smsCode: 'SMS code',
          nicknameOptional: 'Nickname',
        },
        placeholder: {
          phone: 'Phone number',
          smsCode: '123456',
          nickname: 'Nickname',
        },
        validation: {
          emailInvalid: 'Email is invalid',
          passwordLength: 'Password must be at least 8 characters',
          passwordMismatch: 'Passwords do not match',
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

const DivStub = defineComponent({
  name: 'DivStub',
  setup(_, { attrs, slots }) {
    return () => h('div', attrs, slots.default?.());
  },
});

function mountForm() {
  return mount(RegisterForm, {
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
        Progress: defineComponent({
          name: 'ProgressStub',
          props: ['modelValue'],
          setup(props, { attrs }) {
            return () => h('div', { ...attrs, 'data-progress': props.modelValue });
          },
        }),
      },
    },
  });
}

describe('RegisterForm', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('validates password strength and submits a matching email registration', async () => {
    const wrapper = mountForm();

    await wrapper.get('#email').setValue('user@example.com');
    await wrapper.get('#password').setValue('StrongPass1!');
    await nextTick();

    expect(wrapper.text()).toContain('Strong');

    await wrapper.get('#confirmPassword').setValue('WrongPass1!');
    expect(wrapper.text()).toContain('Passwords do not match');

    await wrapper.get('#confirmPassword').setValue('StrongPass1!');
    await wrapper.get('#confirmPassword').trigger('keyup.enter');

    expect(wrapper.emitted('registerByEmail')).toEqual([
      [
        {
          email: 'user@example.com',
          password: 'StrongPass1!',
        },
      ],
    ]);

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Sign in')
      ?.trigger('click');

    expect(wrapper.emitted('login')).toEqual([[]]);
  });

  it('sends phone verification and includes the optional nickname during phone registration', async () => {
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

    await wrapper.get('#code').setValue('654321');
    await wrapper.get('#nickname').setValue('DailyUse');
    await wrapper.get('#nickname').trigger('keyup.enter');

    expect(wrapper.emitted('registerByPhone')).toEqual([
      [
        {
          phoneNumber: '13800138000',
          code: '654321',
          nickname: 'DailyUse',
        },
      ],
    ]);
  });
});
