import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { anIdentityId } from '@dailyuse/test-utils/fixtures';
import {
  NotificationCategory,
  NotificationStatus,
  NotificationType,
} from '@dailyuse/contracts/notification';
import type { INotificationRepository } from '@/server/domain/repositories';
import { Notification } from '@/server/domain/aggregates/notification';
import { UpdateNotificationUseCase } from '../update-notification.use-case';

describe('UpdateNotificationUseCase', () => {
  let notificationRepo: ReturnType<typeof createMockRepo<INotificationRepository>>;
  let useCase: UpdateNotificationUseCase;

  function aNotification() {
    return Notification.create({
      identityId: anIdentityId(),
      title: 'Original title',
      content: 'Original content',
      type: NotificationType.Info,
      category: NotificationCategory.System,
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    notificationRepo = createMockRepo<INotificationRepository>({
      findById: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    });
    useCase = new UpdateNotificationUseCase(notificationRepo);
  });

  it('updates mutable fields and returns a client DTO', async () => {
    const notification = aNotification();
    const expiresAt = Date.now() + 60_000;
    vi.mocked(notificationRepo.findById).mockResolvedValue(notification);

    const result = await useCase.execute(String(notification.id), {
      title: 'Updated title',
      content: 'Updated content',
      status: NotificationStatus.Delivered,
      metadata: {
        icon: 'bell',
        image: null,
        color: '#336699',
        sound: null,
        badge: 3,
      },
      expiresAt,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('Expected ok');
    expect(result.data.title).toBe('Updated title');
    expect(result.data.content).toBe('Updated content');
    expect(result.data.status).toBe(NotificationStatus.Delivered);
    expect(result.data.metadata?.icon).toBe('bell');
    expect(result.data.expiresAt).toBe(expiresAt);
    expect(notificationRepo.save).toHaveBeenCalledWith(notification);
  });

  it('returns NOT_FOUND when the notification does not exist', async () => {
    vi.mocked(notificationRepo.findById).mockResolvedValue(null);

    const result = await useCase.execute('missing-id', { title: 'Nope' });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected error');
    expect(result.error.code).toBe('NOT_FOUND');
    expect(notificationRepo.save).not.toHaveBeenCalled();
  });
});
