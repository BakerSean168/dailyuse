import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import { anIdentityId } from '@memoflow/test-utils/fixtures';
import { NotificationChannelType } from '@memoflow/contracts/notification';
import type { INotificationPreferenceRepository } from '../../../../domain/repositories';
import { NotificationPreference } from '../../../../domain/aggregates/notification-preference';
import { UpdateNotificationPreferenceUseCase } from '../update-notification-preference.use-case';

describe('UpdateNotificationPreferenceUseCase', () => {
  let preferenceRepo: ReturnType<typeof createMockRepo<INotificationPreferenceRepository>>;
  let useCase: UpdateNotificationPreferenceUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    preferenceRepo = createMockRepo<INotificationPreferenceRepository>({
      getOrCreate: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new UpdateNotificationPreferenceUseCase(preferenceRepo);
  });

  it('updates user-global channel preferences', async () => {
    const identityId = anIdentityId();
    const preference = NotificationPreference.create({ identityId });
    vi.mocked(preferenceRepo.getOrCreate).mockResolvedValue(preference);
    const result = await useCase.execute(identityId, {
      globalChannels: { InApp: true, Email: false },
    });
    expect(result.ok).toBe(true);
    expect(preference.getGlobalChannel(NotificationChannelType.InApp)).toBe(true);
    expect(preference.getGlobalChannel(NotificationChannelType.Email)).toBe(false);
    expect(preferenceRepo.save).toHaveBeenCalledWith(preference);
  });

  it('updates workflow-specific overrides independently', async () => {
    const identityId = anIdentityId();
    const preference = NotificationPreference.create({ identityId });
    vi.mocked(preferenceRepo.getOrCreate).mockResolvedValue(preference);
    const result = await useCase.execute(identityId, {
      workflowOverrides: {
        'task.deadline': { Desktop: true, Email: false },
        'goal.progress': { Email: true },
      },
    });
    expect(result.ok).toBe(true);
    expect(preference.getWorkflowChannelOverride('task.deadline', NotificationChannelType.Desktop)).toBe(true);
    expect(preference.getWorkflowChannelOverride('task.deadline', NotificationChannelType.Email)).toBe(false);
    expect(preference.getWorkflowChannelOverride('goal.progress', NotificationChannelType.Email)).toBe(true);
  });

  it('persists DND and rate-limit policy configuration', async () => {
    const identityId = anIdentityId();
    const preference = NotificationPreference.create({ identityId });
    vi.mocked(preferenceRepo.getOrCreate).mockResolvedValue(preference);
    const result = await useCase.execute(identityId, {
      doNotDisturb: {
        enabled: true,
        startTime: '22:00',
        endTime: '08:00',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      },
      rateLimit: { enabled: true, maxPerHour: 3, maxPerDay: 12 },
    });
    expect(result.ok).toBe(true);
    expect(preference.doNotDisturb?.toDTO()).toEqual({
      enabled: true,
      startTime: '22:00',
      endTime: '08:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    });
    expect(preference.rateLimit?.toDTO()).toEqual({ enabled: true, maxPerHour: 3, maxPerDay: 12 });
  });

  it('returns BAD_REQUEST when identityId is empty', async () => {
    const result = await useCase.execute('', { globalChannels: { InApp: true } });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('expected error');
    expect(result.error.code).toBe('BAD_REQUEST');
    expect(preferenceRepo.getOrCreate).not.toHaveBeenCalled();
  });
});
