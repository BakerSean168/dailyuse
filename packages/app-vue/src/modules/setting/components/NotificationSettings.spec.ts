import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestPinia } from '@memoflow/test-utils';
import { ok } from '@memoflow/contracts/result';
import { NOTIFICATION_SERVICE_KEY } from '../../../di/keys';
import settingMessages from '../../../locales/en-US/setting';
import commonMessages from '../../../locales/en-US/common';
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

const basePreference = {
  id: 'INotificationPreferenceId_550e8400-e29b-41d4-a716-446655440000',
  identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
  globalChannels: { InApp: false, Push: false, Email: true },
  workflowOverrides: {
    'task.general': { InApp: true },
    'goal.general': { Push: true },
    'future.workflow': { Webhook: false },
  },
  doNotDisturb: {
    enabled: true,
    startTime: '23:00',
    endTime: '07:30',
    daysOfWeek: [1, 2, 3, 4, 5],
  },
  rateLimit: { enabled: true, maxPerHour: 12, maxPerDay: 60 },
  version: 1,
  createdAt: 1,
  updatedAt: 1,
  deletedAt: null,
} as const;

const service = {
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
};

const passThrough = (tag: string) =>
  defineComponent({
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(tag, attrs, slots.default?.());
    },
  });

function mountSettings() {
  const i18n = createI18n({
    legacy: false,
    locale: 'en-US',
    messages: { 'en-US': { setting: settingMessages, common: commonMessages } },
    missingWarn: false,
    fallbackWarn: false,
  });

  return mount(NotificationSettings, {
    global: {
      plugins: [i18n, createTestPinia()],
      provide: { [NOTIFICATION_SERVICE_KEY as symbol]: service },
      stubs: {
        Card: passThrough('section'),
        CardHeader: passThrough('header'),
        CardTitle: passThrough('h2'),
        CardDescription: passThrough('p'),
        CardContent: passThrough('div'),
        Label: passThrough('label'),
        Button: defineComponent({
          inheritAttrs: false,
          props: { disabled: { type: Boolean, default: false } },
          setup(props, { attrs, slots }) {
            return () =>
              h(
                'button',
                { ...attrs, disabled: props.disabled, type: 'button' },
                slots.default?.(),
              );
          },
        }),
        Switch: defineComponent({
          inheritAttrs: false,
          props: {
            modelValue: { type: Boolean, default: false },
            disabled: { type: Boolean, default: false },
            id: { type: String, default: '' },
          },
          emits: ['update:modelValue'],
          setup(props, { emit, attrs }) {
            return () =>
              h('button', {
                ...attrs,
                type: 'button',
                id: props.id,
                'data-checked': String(props.modelValue),
                disabled: props.disabled,
                onClick: () => emit('update:modelValue', !props.modelValue),
              });
          },
        }),
      },
    },
  });
}

describe('NotificationSettings preference hierarchy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCategory.mockReturnValue({ useCustomNotification: true });
    service.getPreferences.mockResolvedValue(ok(basePreference as never));
    service.updatePreferences.mockImplementation(async (request) =>
      ok({ ...basePreference, ...request, version: 2, updatedAt: 2 } as never),
    );
  });

  it('renders global, workflow, policy, and runtime-owned layers without raw workflow keys', async () => {
    const wrapper = mountSettings();
    await flushPromises();

    expect(wrapper.get('[data-testid="notification-global-channels-card"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="notification-module-channels-card"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="notification-dnd-card"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="notification-rate-limit-card"]').exists()).toBe(true);
    expect(
      wrapper.get('[data-testid="notification-global-inApp"]').attributes('data-checked'),
    ).toBe('false');
    expect(
      wrapper.get('[data-testid="notification-channel-task-inApp"]').attributes('data-checked'),
    ).toBe('true');
    expect(wrapper.get('[data-testid="notification-workflow-account-security"]').text()).toContain(
      'Critical',
    );
    expect(
      wrapper.find('[data-testid="notification-workflow-account-security-inApp"]').exists(),
    ).toBe(false);
    expect(wrapper.text()).not.toContain('task.general');
    expect(wrapper.text()).not.toContain('system.account-security');
  });

  it('updates global and workflow channels through the authenticated preference authority', async () => {
    const wrapper = mountSettings();
    await flushPromises();

    await wrapper.get('[data-testid="notification-global-push"]').trigger('click');
    await flushPromises();
    expect(service.updatePreferences.mock.calls[0][0]).toEqual({
      globalChannels: { InApp: false, Push: true, Email: true },
      workflowOverrides: basePreference.workflowOverrides,
      doNotDisturb: basePreference.doNotDisturb,
      rateLimit: basePreference.rateLimit,
    });

    await wrapper.get('[data-testid="notification-channel-task-push"]').trigger('click');
    await flushPromises();
    expect(service.updatePreferences.mock.calls[1][0]).not.toHaveProperty('identityId');
    expect(service.updatePreferences.mock.calls[1][0].workflowOverrides).toMatchObject({
      'task.general': { InApp: true, Push: true },
      'future.workflow': { Webhook: false },
    });
  });

  it('saves DND and rate-limit policy through the same preference document', async () => {
    const wrapper = mountSettings();
    await flushPromises();

    await wrapper.get('[data-testid="notification-dnd-start"]').setValue('22:15');
    await wrapper.get('[data-testid="notification-dnd-save"]').trigger('click');
    await flushPromises();
    expect(service.updatePreferences.mock.calls[0][0].doNotDisturb).toMatchObject({
      enabled: true,
      startTime: '22:15',
      endTime: '07:30',
    });

    await wrapper.get('[data-testid="notification-rate-limit-hour"]').setValue('24');
    await wrapper.get('[data-testid="notification-rate-limit-save"]').trigger('click');
    await flushPromises();
    expect(service.updatePreferences.mock.calls[1][0].rateLimit).toEqual({
      enabled: true,
      maxPerHour: 24,
      maxPerDay: 60,
    });
  });

  it('keeps the desktop custom-window setting separate from delivery capability', async () => {
    const wrapper = mountSettings();
    await flushPromises();

    await wrapper.get('[data-testid="notification-settings-switch"]').trigger('click');
    await flushPromises();
    expect(updateCategory).toHaveBeenCalledWith('notification', { useCustomNotification: false });
  });
});
