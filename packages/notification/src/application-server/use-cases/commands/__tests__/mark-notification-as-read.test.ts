import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { anIdentityId } from '@dailyuse/test-utils/fixtures';
import type { INotificationRepository } from '@/domain-server/repositories/INotificationRepository';
import { MarkNotificationAsReadUseCase } from '../mark-notification-as-read.use-case';
import { Notification } from '@/domain-server/aggregates/notification';
import {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
} from '@dailyuse/contracts/notification';

describe('MarkNotificationAsReadUseCase', () => {
  let notificationRepo: ReturnType<typeof createMockRepo<INotificationRepository>>;
  let useCase: MarkNotificationAsReadUseCase;

  function aDeliveredNotification() {
    const notification = Notification.create({
      identityId: anIdentityId(),
      title: 'Test',
      content: 'Content',
      type: NotificationType.Info,
      category: NotificationCategory.System,
    });
    // Move to Delivered state
    notification.send();
    notification.markAsDelivered();
    return notification;
  }

  beforeEach(() => {
    vi.clearAllMocks();

    notificationRepo = createMockRepo<INotificationRepository>({
      save: vi.fn().mockResolvedValue(undefined),
      saveMany: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findUnread: vi.fn().mockResolvedValue([]),
    });

    useCase = new MarkNotificationAsReadUseCase(notificationRepo);
  });

  describe('execute()', () => {
    it('should mark a notification as read and return a client DTO', async () => {
      const notification = aDeliveredNotification();
      vi.mocked(notificationRepo.findById).mockResolvedValue(notification);

      const result = await useCase.execute(String(notification.id));

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('Expected ok');
      expect(result.data.isRead).toBe(true);
      expect(result.data.status).toBe(NotificationStatus.Read);
      expect(notificationRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should return error when notification is not found', async () => {
      vi.mocked(notificationRepo.findById).mockResolvedValue(null);

      const result = await useCase.execute('non-existent');

      expect(result.ok).toBe(false);
      if (result.ok) throw new Error('Expected error');
      expect(result.error.code).toBe('NOT_FOUND');
    });

    it('should call findById with the provided id', async () => {
      const notification = aDeliveredNotification();
      vi.mocked(notificationRepo.findById).mockResolvedValue(notification);

      await useCase.execute('test-id-123');

      expect(notificationRepo.findById).toHaveBeenCalledWith('test-id-123');
    });

    it('should be idempotent when notification is already read', async () => {
      const notification = aDeliveredNotification();
      notification.markAsRead();
      vi.mocked(notificationRepo.findById).mockResolvedValue(notification);

      const result = await useCase.execute(String(notification.id));

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('Expected ok');
      expect(result.data.isRead).toBe(true);
      expect(notificationRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeMany()', () => {
    it('should mark found notifications as read and return count', async () => {
      const notifications = [
        aDeliveredNotification(),
        aDeliveredNotification(),
        aDeliveredNotification(),
      ];
      const ids = notifications.map((notification) => String(notification.id));
      vi.mocked(notificationRepo.findById)
        .mockResolvedValueOnce(notifications[0])
        .mockResolvedValueOnce(notifications[1])
        .mockResolvedValueOnce(notifications[2]);

      const result = await useCase.executeMany(ids);

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('Expected ok');
      expect(result.data).toBe(3);
      expect(notificationRepo.saveMany).toHaveBeenCalledTimes(1);
      expect(notifications.every((notification) => notification.isRead)).toBe(true);
    });

    it('should return 0 for empty array', async () => {
      const result = await useCase.executeMany([]);

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('Expected ok');
      expect(result.data).toBe(0);
      expect(notificationRepo.saveMany).toHaveBeenCalledWith([]);
    });
  });

  describe('executeAll()', () => {
    it('should mark unread notifications from the identity and return count', async () => {
      const identityId = anIdentityId();
      const notifications = [aDeliveredNotification(), aDeliveredNotification()];
      vi.mocked(notificationRepo.findUnread).mockResolvedValue(notifications);

      const result = await useCase.executeAll(identityId);

      expect(result.ok).toBe(true);
      if (!result.ok) throw new Error('Expected ok');
      expect(result.data).toBe(2);
      expect(notificationRepo.findUnread).toHaveBeenCalledWith(identityId);
      expect(notificationRepo.saveMany).toHaveBeenCalledWith(notifications);
      expect(notifications.every((notification) => notification.isRead)).toBe(true);
    });
  });
});
