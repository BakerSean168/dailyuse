import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@memoflow/test-utils/mocks';
import { anIdentityId } from '@memoflow/test-utils/fixtures';
import type { INotificationRepository } from '../../../../domain/repositories/i-notification-preference-repository';
import type { INotificationTemplateRepository } from '../../../../domain/repositories/i-notification-preference-repository';
import type { INotificationPreferenceRepository } from '../../../../domain/repositories/i-notification-preference-repository';
import { CreateNotificationUseCase } from '../create-notification.use-case';
import {
  NotificationType,
  NotificationCategory,
  NotificationChannelType,
  NotificationStatus,
} from '@memoflow/contracts/notification';
import { NotificationPreference } from '../../../../domain/aggregates/notification-preference';
import { DoNotDisturbConfig } from '../../../../domain/value-objects/do-not-disturb-config';
import { RateLimit } from '../../../../domain/value-objects/rate-limit';

describe('CreateNotificationUseCase', () => {
  let notificationRepo: ReturnType<typeof createMockRepo<INotificationRepository>>;
  let templateRepo: ReturnType<typeof createMockRepo<INotificationTemplateRepository>>;
  let preferenceRepo: ReturnType<typeof createMockRepo<INotificationPreferenceRepository>>;
  let useCase: CreateNotificationUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    notificationRepo = createMockRepo<INotificationRepository>({
      save: vi.fn().mockResolvedValue(undefined),
      getDeliveryUsage: vi.fn().mockResolvedValue({ hourCount: 0, dayCount: 0 }),
    });
    templateRepo = createMockRepo<INotificationTemplateRepository>();
    preferenceRepo = createMockRepo<INotificationPreferenceRepository>({
      findByIdentityId: vi.fn().mockResolvedValue(null),
    });

    useCase = new CreateNotificationUseCase(
      notificationRepo,
      templateRepo,
      preferenceRepo,
      async () => false,
    );
  });

  it('should create a notification and return a client DTO', async () => {
    const result = await useCase.execute({
      identityId: anIdentityId(),
      title: 'Test Notification',
      content: 'Some content',
      type: NotificationType.Info,
      category: NotificationCategory.System,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok');
    expect(result.data.title).toBe('Test Notification');
    expect(result.data.content).toBe('Some content');
    expect(result.data.type).toBe(NotificationType.Info);
    expect(result.data.category).toBe(NotificationCategory.System);
    expect(result.data.status).toBe(NotificationStatus.Sent);
    expect(result.data.isRead).toBe(false);
  });

  it('should save the notification to the repository', async () => {
    await useCase.execute({
      identityId: anIdentityId(),
      title: 'Test',
      content: 'Content',
      type: NotificationType.Info,
      category: NotificationCategory.System,
    });

    expect(notificationRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should add InApp channel by default', async () => {
    const result = await useCase.execute({
      identityId: anIdentityId(),
      title: 'Test',
      content: 'Content',
      type: NotificationType.Info,
      category: NotificationCategory.System,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok');
    expect(result.data.notificationChannels).toBeDefined();
    expect(result.data.notificationChannels).toHaveLength(1);
    expect(result.data.notificationChannels![0].channelType).toBe(NotificationChannelType.InApp);
  });

  it('should add specified channels', async () => {
    const result = await useCase.execute({
      identityId: anIdentityId(),
      title: 'Test',
      content: 'Content',
      type: NotificationType.Info,
      category: NotificationCategory.System,
      channels: [NotificationChannelType.InApp, NotificationChannelType.Email],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok');
    expect(result.data.notificationChannels).toHaveLength(2);
  });

  it('does not enqueue a disabled channel when another requested channel is allowed', async () => {
    const identityId = anIdentityId();
    const preference = NotificationPreference.create({ identityId });
    preference.setModuleChannels(NotificationCategory.System, [NotificationChannelType.InApp]);
    vi.mocked(preferenceRepo.findByIdentityId).mockResolvedValue(preference);

    const result = await useCase.execute({
      identityId,
      title: 'Mixed channels',
      content: 'Only InApp is allowed',
      type: NotificationType.Info,
      category: NotificationCategory.System,
      channels: [NotificationChannelType.InApp, NotificationChannelType.Email],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok');
    expect(result.data.notificationChannels?.map((channel) => channel.channelType)).toEqual([
      NotificationChannelType.InApp,
    ]);

    const [, outboxDispatches, decisions] = vi.mocked(notificationRepo.save).mock.calls[0];
    expect(outboxDispatches?.map((dispatch) => dispatch.channel)).toEqual([
      NotificationChannelType.InApp,
    ]);
    expect(decisions).toContainEqual({
      channel: NotificationChannelType.Email,
      outcome: 'suppressed',
      reason: 'user_preference_disabled',
    });
  });

  it('preserves the unread Notification Fact when the requested channel is suppressed', async () => {
    const identityId = anIdentityId();
    const pref = NotificationPreference.create({ identityId });
    pref.setModuleChannels(NotificationCategory.System, []);
    vi.mocked(preferenceRepo.findByIdentityId).mockResolvedValue(pref);

    const result = await useCase.execute({
      identityId,
      title: 'Blocked delivery',
      content: 'Fact remains visible',
      type: NotificationType.Info,
      category: NotificationCategory.System,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok');
    expect(result.data.isRead).toBe(false);
    expect(result.data.notificationChannels).toBeNull();

    const [, outboxDispatches, decisions] = vi.mocked(notificationRepo.save).mock.calls[0];
    expect(outboxDispatches).toEqual([]);
    expect(decisions).toContainEqual({
      channel: NotificationChannelType.InApp,
      outcome: 'suppressed',
      reason: 'user_preference_disabled',
    });
  });

  it('defers an allowed channel during DND and records the retry instant', async () => {
    const identityId = anIdentityId();
    const now = new Date('2026-08-25T23:30:00');
    const pref = NotificationPreference.create({ identityId });
    pref.setModuleChannels(NotificationCategory.System, [NotificationChannelType.InApp]);
    const dnd = DoNotDisturbConfig.create({
      enabled: true,
      startTime: '22:00',
      endTime: '08:00',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    });
    pref.setDoNotDisturb(dnd);
    vi.mocked(preferenceRepo.findByIdentityId).mockResolvedValue(pref);
    const dndUseCase = new CreateNotificationUseCase(
      notificationRepo,
      templateRepo,
      preferenceRepo,
      async () => false,
      () => now,
    );

    const result = await dndUseCase.execute({
      identityId,
      title: 'Quiet hours',
      content: 'Deliver later',
      type: NotificationType.Info,
      category: NotificationCategory.System,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok');
    expect(result.data.isRead).toBe(false);
    expect(result.data.notificationChannels?.map((channel) => channel.channelType)).toEqual([
      NotificationChannelType.InApp,
    ]);

    const [, outboxDispatches, decisions] = vi.mocked(notificationRepo.save).mock.calls[0];
    const retryAt = dnd.nextInactiveAt(now);
    expect(retryAt).not.toBeNull();
    expect(outboxDispatches?.[0].deferUntil?.toISOString()).toBe(retryAt?.toISOString());
    expect(decisions?.[0]).toMatchObject({
      channel: NotificationChannelType.InApp,
      outcome: 'deferred',
      reason: 'dnd_active',
    });
  });

  it('delivers immediately when DND has ended', async () => {
    const identityId = anIdentityId();
    const now = new Date('2026-08-26T08:00:00');
    const pref = NotificationPreference.create({ identityId });
    pref.setModuleChannels(NotificationCategory.System, [NotificationChannelType.InApp]);
    pref.setDoNotDisturb(
      DoNotDisturbConfig.create({
        enabled: true,
        startTime: '22:00',
        endTime: '08:00',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      }),
    );
    vi.mocked(preferenceRepo.findByIdentityId).mockResolvedValue(pref);
    const afterDndUseCase = new CreateNotificationUseCase(
      notificationRepo,
      templateRepo,
      preferenceRepo,
      async () => false,
      () => now,
    );

    const result = await afterDndUseCase.execute({
      identityId,
      title: 'Morning',
      content: 'Deliver now',
      type: NotificationType.Info,
      category: NotificationCategory.System,
    });

    expect(result.ok).toBe(true);
    const [, outboxDispatches, decisions] = vi.mocked(notificationRepo.save).mock.calls[0];
    expect(outboxDispatches).toHaveLength(1);
    expect(outboxDispatches?.[0].deferUntil).toBeUndefined();
    expect(decisions?.[0]).toMatchObject({ outcome: 'deliver_now', reason: 'allowed' });
  });

  it('rate-limits the channel without removing the Notification Fact', async () => {
    const identityId = anIdentityId();
    const pref = NotificationPreference.create({ identityId });
    pref.setModuleChannels(NotificationCategory.System, [NotificationChannelType.InApp]);
    pref.setRateLimit(RateLimit.create({ enabled: true, maxPerHour: 1, maxPerDay: 10 }));
    vi.mocked(preferenceRepo.findByIdentityId).mockResolvedValue(pref);
    vi.mocked(notificationRepo.getDeliveryUsage).mockResolvedValue({ hourCount: 1, dayCount: 3 });

    const result = await useCase.execute({
      identityId,
      title: 'Burst',
      content: 'Rate limited',
      type: NotificationType.Info,
      category: NotificationCategory.System,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok');
    expect(result.data.isRead).toBe(false);
    expect(result.data.notificationChannels).toBeNull();
    const [, outboxDispatches, decisions] = vi.mocked(notificationRepo.save).mock.calls[0];
    expect(outboxDispatches).toEqual([]);
    expect(decisions?.[0]).toMatchObject({
      outcome: 'rate_limited',
      reason: 'rate_limit_hour',
    });
  });

  it('queues the channel after the rolling hourly rate window resets', async () => {
    const identityId = anIdentityId();
    const pref = NotificationPreference.create({ identityId });
    pref.setModuleChannels(NotificationCategory.System, [NotificationChannelType.InApp]);
    pref.setRateLimit(RateLimit.create({ enabled: true, maxPerHour: 1, maxPerDay: 10 }));
    vi.mocked(preferenceRepo.findByIdentityId).mockResolvedValue(pref);
    vi.mocked(notificationRepo.getDeliveryUsage).mockResolvedValue({ hourCount: 0, dayCount: 3 });

    const result = await useCase.execute({
      identityId,
      title: 'Window reset',
      content: 'Allowed again',
      type: NotificationType.Info,
      category: NotificationCategory.System,
    });

    expect(result.ok).toBe(true);
    const [, outboxDispatches, decisions] = vi.mocked(notificationRepo.save).mock.calls[0];
    expect(outboxDispatches).toHaveLength(1);
    expect(decisions?.[0]).toMatchObject({ outcome: 'deliver_now', reason: 'allowed' });
  });

  it('should proceed when no preference exists (null)', async () => {
    vi.mocked(preferenceRepo.findByIdentityId).mockResolvedValue(null);

    const result = await useCase.execute({
      identityId: anIdentityId(),
      title: 'Test',
      content: 'Content',
      type: NotificationType.Info,
      category: NotificationCategory.System,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok');
    expect(result.data.id).toBeTruthy();
  });

  it('should return a client DTO with id and timestamps', async () => {
    const result = await useCase.execute({
      identityId: anIdentityId(),
      title: 'DTO check',
      content: 'Content',
      type: NotificationType.Warning,
      category: NotificationCategory.Task,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok');
    expect(result.data.id).toBeTruthy();
    expect(typeof result.data.createdAt).toBe('number');
    expect(typeof result.data.updatedAt).toBe('number');
    expect(result.data.version).toBe(1);
  });

  it('should return FORBIDDEN error when account closure is active', async () => {
    const closureChecker = vi.fn().mockResolvedValue(true);
    const closureUseCase = new CreateNotificationUseCase(
      notificationRepo,
      templateRepo,
      preferenceRepo,
      closureChecker,
    );

    const result = await closureUseCase.execute({
      identityId: anIdentityId(),
      title: 'Closure Test',
      content: 'Content',
      type: NotificationType.Info,
      category: NotificationCategory.System,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected error');
    expect(result.error.code).toBe('FORBIDDEN');
    expect(result.error.message).toContain('Account is closed');
  });
});
