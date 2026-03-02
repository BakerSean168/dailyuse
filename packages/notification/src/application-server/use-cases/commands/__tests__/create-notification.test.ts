import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { anIdentityId } from '@dailyuse/test-utils/fixtures';
import type { INotificationRepository } from '@/domain-server/repositories/INotificationRepository';
import type { INotificationTemplateRepository } from '@/domain-server/repositories/INotificationTemplateRepository';
import type { INotificationPreferenceRepository } from '@/domain-server/repositories/INotificationPreferenceRepository';
import { CreateNotification } from '../create-notification';
import {
  NotificationType,
  NotificationCategory,
  NotificationChannelType,
  NotificationStatus,
} from '@dailyuse/contracts/notification';
import { NotificationPreference } from '@/domain-server/aggregates/notification-preference';

describe('CreateNotification', () => {
  let notificationRepo: ReturnType<typeof createMockRepo<INotificationRepository>>;
  let templateRepo: ReturnType<typeof createMockRepo<INotificationTemplateRepository>>;
  let preferenceRepo: ReturnType<typeof createMockRepo<INotificationPreferenceRepository>>;
  let useCase: CreateNotification;

  beforeEach(() => {
    vi.clearAllMocks();

    notificationRepo = createMockRepo<INotificationRepository>({
      save: vi.fn().mockResolvedValue(undefined),
    });
    templateRepo = createMockRepo<INotificationTemplateRepository>();
    preferenceRepo = createMockRepo<INotificationPreferenceRepository>({
      findByIdentityId: vi.fn().mockResolvedValue(null),
    });

    useCase = new CreateNotification(notificationRepo, templateRepo, preferenceRepo);
  });

  it('should create a notification and return a client DTO', async () => {
    const result = await useCase.execute({
      identityId: anIdentityId(),
      title: 'Test Notification',
      content: 'Some content',
      type: NotificationType.Info,
      category: NotificationCategory.System,
    });

    expect(result).toBeDefined();
    expect(result.title).toBe('Test Notification');
    expect(result.content).toBe('Some content');
    expect(result.type).toBe(NotificationType.Info);
    expect(result.category).toBe(NotificationCategory.System);
    expect(result.status).toBe(NotificationStatus.Sent);
    expect(result.isRead).toBe(false);
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

    expect(result.notificationChannels).toBeDefined();
    expect(result.notificationChannels).toHaveLength(1);
    expect(result.notificationChannels![0].channelType).toBe(NotificationChannelType.InApp);
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

    expect(result.notificationChannels).toHaveLength(2);
  });

  it('should throw when preference blocks the notification', async () => {
    const identityId = anIdentityId();
    const pref = NotificationPreference.create({ identityId });
    // No channels configured for System category => shouldSendNotification returns false
    pref.setModuleChannels(NotificationCategory.System, []);
    vi.mocked(preferenceRepo.findByIdentityId).mockResolvedValue(pref);

    await expect(
      useCase.execute({
        identityId,
        title: 'Blocked',
        content: 'Content',
        type: NotificationType.Info,
        category: NotificationCategory.System,
      }),
    ).rejects.toThrow();
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

    expect(result).toBeDefined();
    expect(result.id).toBeTruthy();
  });

  it('should return a client DTO with id and timestamps', async () => {
    const result = await useCase.execute({
      identityId: anIdentityId(),
      title: 'DTO check',
      content: 'Content',
      type: NotificationType.Warning,
      category: NotificationCategory.Task,
    });

    expect(result.id).toBeTruthy();
    expect(typeof result.createdAt).toBe('number');
    expect(typeof result.updatedAt).toBe('number');
    expect(result.version).toBe(1);
  });
});
