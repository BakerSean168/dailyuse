import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockRepo } from '@dailyuse/test-utils/mocks';
import type { INotificationRepository } from '../../repositories/INotificationRepository';
import type { INotificationTemplateRepository } from '../../repositories/INotificationTemplateRepository';
import type { INotificationPreferenceRepository } from '../../repositories/INotificationPreferenceRepository';
import { NotificationDomainService } from '../NotificationDomainService';
import { Notification } from '../../aggregates/notification';
import { NotificationPreference } from '../../aggregates/notification-preference';
import { NotificationTemplate } from '../../aggregates/notification-template';
import {
  NotificationType,
  NotificationCategory,
  NotificationChannelType,
  NotificationStatus,
} from '@dailyuse/contracts/notification';

describe('NotificationDomainService', () => {
  let notificationRepo: ReturnType<typeof createMockRepo<INotificationRepository>>;
  let templateRepo: ReturnType<typeof createMockRepo<INotificationTemplateRepository>>;
  let preferenceRepo: ReturnType<typeof createMockRepo<INotificationPreferenceRepository>>;
  let service: NotificationDomainService;

  const testIdentityId = 'test-identity-789';

  beforeEach(() => {
    vi.clearAllMocks();

    notificationRepo = createMockRepo<INotificationRepository>({
      save: vi.fn().mockResolvedValue(undefined),
      saveMany: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByIdentityId: vi.fn().mockResolvedValue([]),
      findUnread: vi.fn().mockResolvedValue([]),
      countUnread: vi.fn().mockResolvedValue(0),
      markManyAsRead: vi.fn().mockResolvedValue(undefined),
      markAllAsRead: vi.fn().mockResolvedValue(undefined),
      softDelete: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
      deleteMany: vi.fn().mockResolvedValue(undefined),
    });
    templateRepo = createMockRepo<INotificationTemplateRepository>({
      findById: vi.fn(),
    });
    preferenceRepo = createMockRepo<INotificationPreferenceRepository>({
      findByIdentityId: vi.fn().mockResolvedValue(null),
    });

    service = new NotificationDomainService(notificationRepo, templateRepo, preferenceRepo);
  });

  describe('createAndSendNotification()', () => {
    it('should create, send, and save a notification', async () => {
      const result = await service.createAndSendNotification({
        identityId: testIdentityId,
        title: 'Test',
        content: 'Content',
        type: NotificationType.Info,
        category: NotificationCategory.System,
      });

      expect(result).toBeDefined();
      expect(result.status).toBe(NotificationStatus.Sent);
      expect(notificationRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should add InApp channel by default', async () => {
      const result = await service.createAndSendNotification({
        identityId: testIdentityId,
        title: 'Test',
        content: 'Content',
        type: NotificationType.Info,
        category: NotificationCategory.System,
      });

      expect(result.notificationChannels).toHaveLength(1);
      expect(result.notificationChannels![0].channelType).toBe(NotificationChannelType.InApp);
    });

    it('should add specified channels', async () => {
      const result = await service.createAndSendNotification({
        identityId: testIdentityId,
        title: 'Test',
        content: 'Content',
        type: NotificationType.Info,
        category: NotificationCategory.System,
        channels: [NotificationChannelType.InApp, NotificationChannelType.Email],
      });

      expect(result.notificationChannels).toHaveLength(2);
    });

    it('should throw when user preference blocks notification', async () => {
      const pref = NotificationPreference.create({
        identityId: testIdentityId,
        // no defaultChannels — empty settings
      });
      // Override the mock to return this preference that has 'system' module configured
      // but without InApp channel
      pref.setModuleChannels(NotificationCategory.System, []);
      vi.mocked(preferenceRepo.findByIdentityId).mockResolvedValue(pref);

      await expect(
        service.createAndSendNotification({
          identityId: testIdentityId,
          title: 'Blocked',
          content: 'Content',
          type: NotificationType.Info,
          category: NotificationCategory.System,
        }),
      ).rejects.toThrow('User preferences block this notification');
    });

    it('should proceed when no preference exists', async () => {
      vi.mocked(preferenceRepo.findByIdentityId).mockResolvedValue(null);

      const result = await service.createAndSendNotification({
        identityId: testIdentityId,
        title: 'Test',
        content: 'Content',
        type: NotificationType.Info,
        category: NotificationCategory.System,
      });

      expect(result).toBeDefined();
      expect(notificationRepo.save).toHaveBeenCalled();
    });
  });

  describe('markAsRead()', () => {
    it('should find, mark as read, and save the notification', async () => {
      const notification = Notification.create({
        identityId: testIdentityId,
        title: 'Test',
        content: 'Content',
        type: NotificationType.Info,
        category: NotificationCategory.System,
      });
      await notification.send();
      notification.markAsDelivered();
      vi.mocked(notificationRepo.findById).mockResolvedValue(notification);

      await service.markAsRead(String(notification.id));

      expect(notification.isRead).toBe(true);
      expect(notificationRepo.save).toHaveBeenCalled();
    });

    it('should throw when notification is not found', async () => {
      vi.mocked(notificationRepo.findById).mockResolvedValue(null);

      await expect(service.markAsRead('non-existent')).rejects.toThrow('Notification not found');
    });
  });

  describe('markManyAsRead()', () => {
    it('should mark found notifications as read and save them', async () => {
      const notifications = [
        Notification.create({
          identityId: testIdentityId,
          title: 'A',
          content: 'A',
          type: NotificationType.Info,
          category: NotificationCategory.System,
        }),
        Notification.create({
          identityId: testIdentityId,
          title: 'B',
          content: 'B',
          type: NotificationType.Info,
          category: NotificationCategory.System,
        }),
      ];
      for (const notification of notifications) {
        await notification.send();
        notification.markAsDelivered();
      }
      vi.mocked(notificationRepo.findById)
        .mockResolvedValueOnce(notifications[0])
        .mockResolvedValueOnce(notifications[1]);

      await service.markManyAsRead(['id-1', 'id-2']);

      expect(notificationRepo.saveMany).toHaveBeenCalledWith(notifications);
      expect(notifications.every((notification) => notification.isRead)).toBe(true);
    });
  });

  describe('markAllAsRead()', () => {
    it('should mark unread notifications as read and save them', async () => {
      const notifications = [
        Notification.create({
          identityId: testIdentityId,
          title: 'A',
          content: 'A',
          type: NotificationType.Info,
          category: NotificationCategory.System,
        }),
      ];
      for (const notification of notifications) {
        await notification.send();
        notification.markAsDelivered();
      }
      vi.mocked(notificationRepo.findUnread).mockResolvedValue(notifications);

      await service.markAllAsRead(testIdentityId);

      expect(notificationRepo.findUnread).toHaveBeenCalledWith(testIdentityId);
      expect(notificationRepo.saveMany).toHaveBeenCalledWith(notifications);
    });
  });

  describe('deleteNotification()', () => {
    it('should soft delete by default through the aggregate', async () => {
      const notification = Notification.create({
        identityId: testIdentityId,
        title: 'Test',
        content: 'Content',
        type: NotificationType.Info,
        category: NotificationCategory.System,
      });
      vi.mocked(notificationRepo.findById).mockResolvedValue(notification);

      await service.deleteNotification('id-1');

      expect(notification.deletedAt).toBeInstanceOf(Date);
      expect(notificationRepo.save).toHaveBeenCalledWith(notification);
    });

    it('should hard delete when soft=false', async () => {
      await service.deleteNotification('id-1', false);

      expect(notificationRepo.delete).toHaveBeenCalledWith('id-1');
    });
  });
});
