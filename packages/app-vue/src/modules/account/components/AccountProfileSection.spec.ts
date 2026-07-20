import { defineComponent, h } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { describe, expect, it, vi } from 'vitest';
import { fail } from '@dailyuse/contracts/result';
import type { IAccountService } from '../../../di/types';
import { ACCOUNT_SERVICE_KEY, AUTH_SERVICE_KEY, LOGOUT_HANDLER_KEY } from '../../../di/keys';
import AccountProfileSection from './AccountProfileSection.vue';

vi.mock('../../authentication/composables/useSession', async () => {
  const { ref } = await import('vue');
  return {
    useSession: () => ({
      activeSessions: ref([]),
      loadSessions: vi.fn().mockResolvedValue(true),
      revokeSession: vi.fn().mockResolvedValue(true),
    }),
  };
});

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
        oauth: {
          title: 'Sign-in methods',
          description: 'Link GitHub for identity only.',
          githubLinked: 'GitHub linked',
          githubNotLinked: 'GitHub not linked',
          bindGithub: 'Link GitHub',
          unbindGithub: 'Unlink GitHub',
          bindSuccess: 'linked',
          unbindSuccess: 'unlinked',
          bindFailed: 'bind failed',
          unbindFailed: 'unbind failed',
          githubUnavailable: 'unavailable',
          serviceUnavailable: 'service unavailable',
          alreadyLinked: 'already linked',
          lastLoginPath: 'last path',
          invalidState: 'invalid state',
          unbindConfirmTitle: 'Unlink?',
          unbindConfirmDescription: 'Confirm unlink',
          unbindConfirmText: 'Unlink',
          repoScopeHint: 'repo hint',
        },
        sessions: {
          title: 'Devices & sessions',
          description: 'Manage sessions',
          loading: 'Loading sessions…',
          empty: 'No active sessions',
          current: 'This device',
          lastActive: 'Last active',
          revoke: 'Revoke',
          refresh: 'Refresh',
          unknownDevice: 'Unknown device',
          cannotRevokeCurrent: 'Cannot revoke current',
          revokeConfirmTitle: 'Revoke?',
          revokeConfirmDescription: 'Need re-login',
          revokeConfirmText: 'Revoke',
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
        [AUTH_SERVICE_KEY as symbol]: {
          getCurrentUser: vi.fn().mockResolvedValue({
            ok: true,
            data: {
              identity: { hasOAuth: false },
              session: null,
              emailVerification: { required: false },
            },
          }),
          getOAuthUrl: vi.fn(),
          bindOAuth: vi.fn(),
          unbindOAuth: vi.fn(),
        },
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
        GitBranch: true,
        Link2Off: true,
      },
    },
  });
}

describe('AccountProfileSection', () => {
  it('shows a retryable error instead of an endless loading state', async () => {
    const getMyProfile = vi
      .fn()
      .mockResolvedValue(fail({ code: 'NOT_FOUND', message: 'Account not found' }));
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
    expect(wrapper.get('[data-testid="account-oauth-card"]').text()).toContain('GitHub not linked');
    expect(wrapper.get('[data-testid="account-oauth-bind"]').text()).toContain('Link GitHub');

    await wrapper.get('[data-testid="account-profile-retry"]').trigger('click');
    await flushPromises();

    expect(getMyProfile).toHaveBeenCalledTimes(2);
  });
});
