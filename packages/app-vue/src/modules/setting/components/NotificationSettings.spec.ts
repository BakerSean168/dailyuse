import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestPinia } from '@dailyuse/test-utils';
import { ok } from '@dailyuse/contracts/result';
import { NOTIFICATION_SERVICE_KEY } from '../../../di/keys';
import NotificationSettings from './NotificationSettings.vue';

const updateCategory = vi.fn(async () => undefined);
const getCategory = vi.fn(() => ({ useCustomNotification: true }));

vi.mock('../composables/useUserSetting', () => ({
  useUserSetting: () => ({
    getCategory,
    updateCategory,
    isLoading: false,
  }),
}));

const service = {
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
};

const messages = {
  setting: {
    notifications: {
      title: 'Notifications',
      description: 'desc',
      useCustomNotification: 'Custom',
      useCustomNotificationDescription: 'custom desc',
      moduleChannelsTitle: 'Module channels',
      moduleChannelsDescription: 'module desc',
      loadPreferencesFailed: 'load failed',
      updatePreferencesFailed: 'update failed',
      channels: { inApp: 'In-app', push: 'Push' },
      modules: {
        task: 'Tasks',
        goal: 'Goals',
        schedule: 'Schedule',
        reminder: 'Reminders',
        account: 'Account',
        system: 'System',
      },
    },
  },
};

function mountSettings() {
  const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': messages } });
  return mount(NotificationSettings, {
    global: {
      plugins: [i18n, createTestPinia()],
      provide: {
        [NOTIFICATION_SERVICE_KEY as symbol]: service,
      },
      stubs: {
        Card: defineComponent({
          setup(_, { slots }) {
            return () => h('div', { class: 'card' }, slots.default?.());
          },
        }),
        CardHeader: defineComponent({
          setup(_, { slots }) {
            return () => h('div', slots.default?.());
          },
        }),
        CardTitle: defineComponent({
          setup(_, { slots }) {
            return () => h('h3', slots.default?.());
          },
        }),
        CardDescription: defineComponent({
          setup(_, { slots }) {
            return () => h('p', slots.default?.());
          },
        }),
        CardContent: defineComponent({
          setup(_, { slots }) {
            return () => h('div', slots.default?.());
          },
        }),
        Label: defineComponent({
          setup(_, { slots }) {
            return () => h('label', slots.default?.());
          },
        }),
        Switch: defineComponent({
          props: {
            checked: { type: Boolean, default: false },
            disabled: { type: Boolean, default: false },
            id: { type: String, default: '' },
          },
          emits: ['update:checked'],
          setup(props, { emit, attrs }) {
            return () =>
              h('button', {
                type: 'button',
                id: props.id,
                'data-testid': attrs['data-testid'],
                'data-checked': String(props.checked),
                disabled: props.disabled,
                onClick: () => emit('update:checked', !props.checked),
              });
          },
        }),
      },
    },
  });
}

describe('NotificationSettings residual 199', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCategory.mockReturnValue({ useCustomNotification: true });
    service.getPreferences.mockResolvedValue(
      ok({
        id: 'INotificationPreferenceId_550e8400-e29b-41d4-a716-446655440000',
        identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
        settings: { task: ['InApp'] },
        version: 1,
        createdAt: 1,
        updatedAt: 1,
        deletedAt: null,
      }),
    );
    service.updatePreferences.mockResolvedValue(
      ok({
        id: 'INotificationPreferenceId_550e8400-e29b-41d4-a716-446655440000',
        identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
        settings: { task: ['InApp', 'Push'] },
        version: 2,
        createdAt: 1,
        updatedAt: 2,
        deletedAt: null,
      }),
    );
  });

  it('loads module channel preferences on mount without identity dual-track', async () => {
    const wrapper = mountSettings();
    await flushPromises();

    expect(service.getPreferences).toHaveBeenCalledWith();
    expect(wrapper.get('[data-testid="notification-module-channels-card"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="notification-module-task"]').exists()).toBe(true);
    expect(
      wrapper.get('[data-testid="notification-channel-task-inApp"]').attributes('data-checked'),
    ).toBe('true');
    expect(
      wrapper.get('[data-testid="notification-channel-task-push"]').attributes('data-checked'),
    ).toBe('false');
  });

  it('toggles a module push channel via updatePreferences categories only', async () => {
    const wrapper = mountSettings();
    await flushPromises();

    await wrapper.get('[data-testid="notification-channel-task-push"]').trigger('click');
    await flushPromises();

    expect(service.updatePreferences).toHaveBeenCalledWith({
      categories: {
        task: { inApp: true, push: true, email: false, sms: false },
      },
    });
    expect(service.updatePreferences.mock.calls[0][0]).not.toHaveProperty('identityId');
  });

  it('still updates desktop custom-notification setting via user-setting category', async () => {
    const wrapper = mountSettings();
    await flushPromises();

    await wrapper.get('[data-testid="notification-settings-switch"]').trigger('click');
    await flushPromises();

    expect(updateCategory).toHaveBeenCalledWith('notification', {
      useCustomNotification: false,
    });
  });
});
