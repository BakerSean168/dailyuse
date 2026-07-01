import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { anIdentityId } from '@dailyuse/test-utils/fixtures';
import { NotificationChannelType } from '@dailyuse/contracts/notification';
import type { INotificationPreferenceRepository } from '@/domain-server/repositories';
import { NotificationPreference } from '@/domain-server/aggregates/notification-preference';
import { UpdateNotificationPreferenceUseCase } from '../update-notification-preference.use-case';

describe('UpdateNotificationPreferenceUseCase', () => {
  let preferenceRepo: ReturnType<typeof createMockRepo<INotificationPreferenceRepository>>;
  let useCase: UpdateNotificationPreferenceUseCase;

  function aPreference(identityId = anIdentityId()) {
    return NotificationPreference.create({
      identityId,
      defaultChannels: [NotificationChannelType.InApp],
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    preferenceRepo = createMockRepo<INotificationPreferenceRepository>({
      getOrCreate: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new UpdateNotificationPreferenceUseCase(preferenceRepo);
  });

  it('updates category-specific channels', async () => {
    const identityId = anIdentityId();
    const preference = aPreference(identityId);
    vi.mocked(preferenceRepo.getOrCreate).mockResolvedValue(preference);

    const result = await useCase.execute({
      identityId,
      categories: {
        task: { inApp: true, email: true, push: false, sms: false },
        goal: { inApp: false, email: false, push: true, sms: false },
      },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok');
    expect(preference.getModuleChannels('task')).toEqual([
      NotificationChannelType.InApp,
      NotificationChannelType.Email,
    ]);
    expect(preference.getModuleChannels('goal')).toEqual([NotificationChannelType.Push]);
    expect(preferenceRepo.save).toHaveBeenCalledWith(preference);
  });

  it('applies fallback channels to default modules when categories are absent', async () => {
    const identityId = anIdentityId();
    const preference = aPreference(identityId);
    vi.mocked(preferenceRepo.getOrCreate).mockResolvedValue(preference);

    const result = await useCase.execute({
      identityId,
      channels: { inApp: true, email: false, push: true, sms: false },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok');
    expect(preference.getModuleChannels('task')).toEqual([
      NotificationChannelType.InApp,
      NotificationChannelType.Push,
    ]);
    expect(preference.getModuleChannels('system')).toEqual([
      NotificationChannelType.InApp,
      NotificationChannelType.Push,
    ]);
  });

  it('returns BAD_REQUEST when identityId is missing', async () => {
    const result = await useCase.execute({ channels: { inApp: true } });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected error');
    expect(result.error.code).toBe('BAD_REQUEST');
    expect(preferenceRepo.getOrCreate).not.toHaveBeenCalled();
  });
});
