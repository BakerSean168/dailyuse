import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { fail, ok } from '@memoflow/contracts/result';
import { NOTIFICATION_SERVICE_KEY } from '../../../di/keys';
import {
  NOTIFICATION_PREFERENCE_WORKFLOW_GROUPS,
  useNotificationPreferences,
} from './useNotificationPreferences';

const service = {
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
};

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

function mountComposable() {
  const i18n = createI18n({
    legacy: false,
    locale: 'en-US',
    messages: {
      'en-US': {
        setting: {
          notifications: {
            loadPreferencesFailed: 'load failed',
            updatePreferencesFailed: 'update failed',
          },
        },
      },
    },
  });

  let api: ReturnType<typeof useNotificationPreferences> | null = null;
  const Host = defineComponent({
    setup() {
      api = useNotificationPreferences();
      return () => h('div');
    },
  });

  mount(Host, {
    global: {
      plugins: [i18n],
      provide: { [NOTIFICATION_SERVICE_KEY as symbol]: service },
    },
  });

  if (!api) throw new Error('composable not mounted');
  return api;
}

describe('useNotificationPreferences hierarchy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    service.getPreferences.mockResolvedValue(ok(basePreference as never));
    service.updatePreferences.mockImplementation(async (request) =>
      ok({
        ...basePreference,
        ...request,
        version: 2,
        updatedAt: 2,
      } as never),
    );
  });

  it('resolves workflow override before global and exposes stable product workflows', async () => {
    const api = mountComposable();
    await api.loadPreferences();
    await flushPromises();

    expect(api.globalChannelEnabled('inApp')).toBe(false);
    expect(api.workflowChannelEnabled('task.general', 'inApp')).toBe(true);
    expect(api.workflowChannelSource('task.general', 'inApp')).toBe('workflow');
    expect(api.workflowChannelEnabled('task.general', 'push')).toBe(false);
    expect(api.workflowChannelSource('task.general', 'push')).toBe('global');
    expect(
      NOTIFICATION_PREFERENCE_WORKFLOW_GROUPS.flatMap((group) => group.workflows).find(
        (workflow) => workflow.id === 'account-security',
      )?.readOnly,
    ).toBe(true);
  });

  it('updates a global channel while preserving workflows, DND, rate limits, and future map entries', async () => {
    const api = mountComposable();
    await api.loadPreferences();
    await api.setGlobalChannel('push', true);

    expect(service.updatePreferences).toHaveBeenCalledWith({
      globalChannels: { InApp: false, Push: true, Email: true },
      workflowOverrides: basePreference.workflowOverrides,
      doNotDisturb: basePreference.doNotDisturb,
      rateLimit: basePreference.rateLimit,
    });
    expect(service.updatePreferences.mock.calls[0][0]).not.toHaveProperty('identityId');
  });

  it('updates one workflow channel without dropping sibling or forward-compatible overrides', async () => {
    const api = mountComposable();
    await api.loadPreferences();
    const saved = await api.setWorkflowChannel('task.general', 'push', true);

    expect(saved).toBe(true);
    expect(service.updatePreferences).toHaveBeenCalledWith({
      globalChannels: basePreference.globalChannels,
      workflowOverrides: {
        ...basePreference.workflowOverrides,
        'task.general': { InApp: true, Push: true },
      },
      doNotDisturb: basePreference.doNotDisturb,
      rateLimit: basePreference.rateLimit,
    });
    expect(api.workflowChannelEnabled('task.general', 'push')).toBe(true);
  });

  it('saves DND and rate-limit layers independently while preserving the other hierarchy layers', async () => {
    const api = mountComposable();
    await api.loadPreferences();

    await api.saveDoNotDisturb({
      enabled: false,
      startTime: '22:30',
      endTime: '06:30',
      daysOfWeek: [0, 6],
    });
    expect(service.updatePreferences.mock.calls[0][0]).toEqual({
      globalChannels: basePreference.globalChannels,
      workflowOverrides: basePreference.workflowOverrides,
      doNotDisturb: {
        enabled: false,
        startTime: '22:30',
        endTime: '06:30',
        daysOfWeek: [0, 6],
      },
      rateLimit: basePreference.rateLimit,
    });

    await api.saveRateLimit({ enabled: false, maxPerHour: 30, maxPerDay: 120 });
    expect(service.updatePreferences.mock.calls[1][0]).toMatchObject({
      globalChannels: basePreference.globalChannels,
      workflowOverrides: basePreference.workflowOverrides,
      rateLimit: { enabled: false, maxPerHour: 30, maxPerDay: 120 },
    });
  });

  it('surfaces load failures without inventing a local preference document', async () => {
    service.getPreferences.mockResolvedValue(fail({ code: 'INTERNAL', message: 'boom' }));
    const api = mountComposable();
    await api.loadPreferences();
    await flushPromises();

    expect(api.error.value).toBe('boom');
    expect(api.preference.value).toBeNull();
  });
});
