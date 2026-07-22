import { describe, expect, it, vi, beforeEach } from 'vitest';
import { defineComponent, h } from 'vue';
import { mount, flushPromises } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';
import { ok, fail } from '@dailyuse/contracts/result';
import { NOTIFICATION_SERVICE_KEY } from '../../../di/keys';
import {
  useNotificationPreferences,
  NOTIFICATION_PREFERENCE_MODULES,
} from './useNotificationPreferences';

const service = {
  getPreferences: vi.fn(),
  updatePreferences: vi.fn(),
};

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
      provide: {
        [NOTIFICATION_SERVICE_KEY as symbol]: service,
      },
    },
  });

  if (!api) throw new Error('composable not mounted');
  return api;
}

describe('useNotificationPreferences (residual 199)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads preferences without passing identityId dual-track', async () => {
    service.getPreferences.mockResolvedValue(
      ok({
        id: 'INotificationPreferenceId_550e8400-e29b-41d4-a716-446655440000',
        identityId: 'IdentityId_550e8400-e29b-41d4-a716-446655440000',
        settings: { task: ['InApp', 'Push'] },
        version: 1,
        createdAt: 1,
        updatedAt: 1,
        deletedAt: null,
      }),
    );

    const api = mountComposable();
    await api.loadPreferences();
    await flushPromises();

    expect(service.getPreferences).toHaveBeenCalledWith();
    expect(service.getPreferences.mock.calls[0]).toEqual([]);
    expect(api.hasChannel('task', 'inApp')).toBe(true);
    expect(api.hasChannel('task', 'push')).toBe(true);
    expect(api.hasChannel('goal', 'inApp')).toBe(false);
    expect(NOTIFICATION_PREFERENCE_MODULES).toContain('task');
  });

  it('updates a module channel via categories without identityId', async () => {
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

    const api = mountComposable();
    await api.loadPreferences();
    const saved = await api.setModuleChannel('task', 'push', true);
    await flushPromises();

    expect(saved).toBe(true);
    expect(service.updatePreferences).toHaveBeenCalledWith({
      categories: {
        task: { inApp: true, push: true, email: false, sms: false },
      },
    });
    // No identity dual-track on client call.
    expect(service.updatePreferences.mock.calls[0][0]).not.toHaveProperty('identityId');
    expect(api.hasChannel('task', 'push')).toBe(true);
  });

  it('surfaces load failures without throwing', async () => {
    service.getPreferences.mockResolvedValue(fail({ code: 'INTERNAL', message: 'boom' }));
    const api = mountComposable();
    await api.loadPreferences();
    await flushPromises();
    expect(api.error.value).toBeTruthy();
    expect(api.preference.value).toBeNull();
  });
});
