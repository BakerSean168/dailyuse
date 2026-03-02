import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import { anIdentityId } from '@dailyuse/test-utils/fixtures';
import type { INotificationRepository } from '@/domain-server/repositories/INotificationRepository';
import { MarkNotificationAsRead } from '../mark-notification-as-read';
import { Notification } from '@/domain-server/aggregates/notification';
import {
  NotificationType,
  NotificationCategory,
  NotificationStatus,
} from '@dailyuse/contracts/notification';

describe('MarkNotificationAsRead', () => {
  let notificationRepo: ReturnType<typeof createMockRepo<INotificationRepository>>;
  let useCase: MarkNotificationAsRead;

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
      findById: vi.fn(),
      markManyAsRead: vi.fn().mockResolvedValue(undefined),
      markAllAsRead: vi.fn().mockResolvedValue(undefined),
    });

    useCase = new MarkNotificationAsRead(notificationRepo);
  });

  describe('execute()', () => {
    it('should mark a notification as read and save it', async () => {
      const notification = aDeliveredNotification();
      vi.mocked(notificationRepo.findById).mockResolvedValue(notification);

      await useCase.execute(String(notification.id));

      expect(notification.isRead).toBe(true);
      expect(notification.status).toBe(NotificationStatus.Read);
      expect(notificationRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should throw when notification is not found', async () => {
      vi.mocked(notificationRepo.findById).mockResolvedValue(null);

      await expect(useCase.execute('non-existent')).rejects.toThrow('Notification not found');
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

      await useCase.execute(String(notification.id));

      expect(notification.isRead).toBe(true);
      expect(notificationRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('executeMany()', () => {
    it('should delegate to repository markManyAsRead', async () => {
      const ids = ['id-1', 'id-2', 'id-3'];

      await useCase.executeMany(ids);

      expect(notificationRepo.markManyAsRead).toHaveBeenCalledWith(ids);
    });

    it('should handle empty array', async () => {
      await useCase.executeMany([]);

      expect(notificationRepo.markManyAsRead).toHaveBeenCalledWith([]);
    });
  });

  describe('executeAll()', () => {
    it('should delegate to repository markAllAsRead', async () => {
      const identityId = anIdentityId();

      await useCase.executeAll(identityId);

      expect(notificationRepo.markAllAsRead).toHaveBeenCalledWith(identityId);
    });
  });
});
