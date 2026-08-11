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

describe('CreateNotificationUseCase', () => {
  let notificationRepo: ReturnType<typeof createMockRepo<INotificationRepository>>;
  let templateRepo: ReturnType<typeof createMockRepo<INotificationTemplateRepository>>;
  let preferenceRepo: ReturnType<typeof createMockRepo<INotificationPreferenceRepository>>;
  let useCase: CreateNotificationUseCase;

  beforeEach(() => {
    vi.clearAllMocks();

    notificationRepo = createMockRepo<INotificationRepository>({
      save: vi.fn().mockResolvedValue(undefined),
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

  it('should return error when preference blocks the notification', async () => {
    const identityId = anIdentityId();
    const pref = NotificationPreference.create({ identityId });
    // No channels configured for System category => shouldSendNotification returns false
    pref.setModuleChannels(NotificationCategory.System, []);
    vi.mocked(preferenceRepo.findByIdentityId).mockResolvedValue(pref);

    const result = await useCase.execute({
      identityId,
      title: 'Blocked',
      content: 'Content',
      type: NotificationType.Info,
      category: NotificationCategory.System,
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected error');
    expect(result.error.code).toBe('FORBIDDEN');
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
