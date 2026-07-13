import { defineComponent, h } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it, vi } from 'vitest';
import { fail } from '@dailyuse/contracts/result';
import type { IAccountService } from '../../../di/types';
import { ACCOUNT_SERVICE_KEY, LOGOUT_HANDLER_KEY } from '../../../di/keys';
import AccountProfileSection from './AccountProfileSection.vue';

vi.mock('vue-sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': {
      common: { retry: 'Retry' },
      errors: { NOT_FOUND: 'Account not found' },
      account: {
        center: 'Account',
        description: 'Manage your account.',
        status: { loading: 'Loading profile...' },
        actions: { saveProfile: 'Save', logout: 'Log out' },
        profile: { nickname: 'Nickname', avatarUrl: 'Avatar', bio: 'Bio' },
        placeholder: { nickname: 'Nickname', avatarUrl: 'Avatar URL', bio: 'Bio' },
        logoutHint: 'Sign out of this device.',
        toast: { loadFailed: 'Failed to load profile' },
        logoutConfirm: {
          title: 'Log out',
          description: 'Confirm logout.',
          confirmText: 'Log out',
          cancelText: 'Cancel',
        },
      },
    },
  },
});

const PassthroughStub = defineComponent({
  name: 'PassthroughStub',
  setup(_, { attrs, slots }) {
    return () => h('div', attrs, slots.default?.());
  },
});

const ButtonStub = defineComponent({
  name: 'ButtonStub',
  props: ['disabled'],
  emits: ['click'],
  setup(props, { attrs, emit, slots }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          type: 'button',
          disabled: props.disabled,
          onClick: () => emit('click'),
        },
        slots.default?.(),
      );
  },
});

function mountSection(accountService: IAccountService) {
  return mount(AccountProfileSection, {
    global: {
      plugins: [i18n],
      provide: {
        [ACCOUNT_SERVICE_KEY as symbol]: accountService,
        [LOGOUT_HANDLER_KEY as symbol]: vi.fn(),
      },
      stubs: {
        Button: ButtonStub,
        Card: PassthroughStub,
        CardContent: PassthroughStub,
        CardDescription: PassthroughStub,
        CardFooter: PassthroughStub,
        CardHeader: PassthroughStub,
        CardTitle: PassthroughStub,
        Input: true,
        Label: true,
        Avatar: PassthroughStub,
        AvatarFallback: PassthroughStub,
        AvatarImage: true,
        Separator: true,
        LogOut: true,
      },
    },
  });
}

describe('AccountProfileSection', () => {
  it('shows a retryable error instead of an endless loading state', async () => {
    const getMyProfile = vi.fn().mockResolvedValue(
      fail({ code: 'NOT_FOUND', message: 'Account not found' }),
    );
    const accountService = {
      getMyProfile,
      updateMyProfile: vi.fn(),
      checkAvailability: vi.fn(),
      updateSettings: vi.fn(),
      closeAccount: vi.fn(),
    } as unknown as IAccountService;

    const wrapper = mountSection(accountService);
    await flushPromises();

    expect(wrapper.get('[data-testid="account-profile-error"]').text()).toContain(
      'Account not found',
    );
    expect(wrapper.find('[data-testid="account-profile-loading"]').exists()).toBe(false);

    await wrapper.get('[data-testid="account-profile-retry"]').trigger('click');
    await flushPromises();

    expect(getMyProfile).toHaveBeenCalledTimes(2);
  });
});
