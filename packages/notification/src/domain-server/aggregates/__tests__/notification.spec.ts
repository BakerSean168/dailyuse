import { describe, it, expect } from 'vitest';
import { Notification } from '../notification';
import { NotificationChannel } from '../../entities/notification-channel';
import {
  NotificationStatus,
  NotificationType,
  NotificationCategory,
  NotificationChannelType,
} from '@dailyuse/contracts/notification';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

describe('Notification Aggregate Root', () => {
  const testIdentityId = 'test-identity-123';

  function aNotification(overrides: Partial<Parameters<typeof Notification.create>[0]> = {}) {
    return Notification.create({
      identityId: testIdentityId,
      title: 'Test Notification',
      content: 'Test notification content',
      type: NotificationType.Info,
      category: NotificationCategory.System,
      ...overrides,
    });
  }

  describe('create()', () => {
    it('should create a notification with Pending status', () => {
      const notification = aNotification();

      expect(notification.id).toBeTruthy();
      expect(notification.identityId).toBe(testIdentityId);
      expect(notification.title).toBe('Test Notification');
      expect(notification.content).toBe('Test notification content');
      expect(notification.type).toBe(NotificationType.Info);
      expect(notification.category).toBe(NotificationCategory.System);
      expect(notification.status).toBe(NotificationStatus.Pending);
      expect(notification.isRead).toBe(false);
      expect(notification.readAt).toBeNull();
      expect(notification.version).toBe(1);
      expect(notification.deletedAt).toBeNull();
    });

    it('should use Moderate importance by default', () => {
      const notification = aNotification();

      expect(notification.importance).toBe('Moderate');
    });

    it('should accept a custom importance level', () => {
      const notification = aNotification({ importance: ImportanceLevel.Vital });

      expect(notification.importance).toBe(ImportanceLevel.Vital);
    });

    it('should set createdAt and updatedAt to the same date', () => {
      const notification = aNotification();

      expect(notification.createdAt).toBeInstanceOf(Date);
      expect(notification.updatedAt).toBeInstanceOf(Date);
      expect(notification.createdAt.getTime()).toBe(notification.updatedAt.getTime());
    });

    it('should start with no channels', () => {
      const notification = aNotification();

      expect(notification.notificationChannels).toBeNull();
    });

    it('should set actions to null when not provided', () => {
      const notification = aNotification();

      expect(notification.actions).toBeNull();
    });

    it('should set metadata to null when not provided', () => {
      const notification = aNotification();

      expect(notification.metadata).toBeNull();
    });
  });

  describe('send()', () => {
    it('should transition from Pending to Sent', async () => {
      const notification = aNotification();

      await notification.send();

      expect(notification.status).toBe(NotificationStatus.Sent);
    });

    it('should throw when sending a non-Pending notification', async () => {
      const notification = aNotification();
      await notification.send();

      await expect(notification.send()).rejects.toThrow();
    });

    it('should update updatedAt after sending', async () => {
      const notification = aNotification();
      const before = notification.updatedAt;

      await notification.send();

      expect(notification.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('markAsDelivered()', () => {
    it('should transition from Sent to Delivered', async () => {
      const notification = aNotification();
      await notification.send();

      notification.markAsDelivered();

      expect(notification.status).toBe(NotificationStatus.Delivered);
    });

    it('should throw when not in Sent status', () => {
      const notification = aNotification();

      expect(() => notification.markAsDelivered()).toThrow();
    });

    it('should throw when already Delivered', async () => {
      const notification = aNotification();
      await notification.send();
      notification.markAsDelivered();

      expect(() => notification.markAsDelivered()).toThrow();
    });
  });

  describe('markAsRead()', () => {
    it('should set isRead to true and status to Read', async () => {
      const notification = aNotification();
      await notification.send();
      notification.markAsDelivered();

      notification.markAsRead();

      expect(notification.isRead).toBe(true);
      expect(notification.readAt).toBeTruthy();
      expect(notification.status).toBe(NotificationStatus.Read);
    });

    it('should be idempotent when already read', async () => {
      const notification = aNotification();
      await notification.send();
      notification.markAsDelivered();
      notification.markAsRead();
      const firstReadAt = notification.readAt;

      notification.markAsRead();

      expect(notification.readAt).toBe(firstReadAt);
      expect(notification.isRead).toBe(true);
    });

    it('should set readAt timestamp', async () => {
      const notification = aNotification();
      await notification.send();
      notification.markAsDelivered();

      notification.markAsRead();

      expect(typeof notification.readAt).toBe('number');
      expect(notification.readAt).toBeGreaterThan(0);
    });
  });

  describe('markAsUnread()', () => {
    it('should set isRead to false and status to Delivered', async () => {
      const notification = aNotification();
      await notification.send();
      notification.markAsDelivered();
      notification.markAsRead();

      notification.markAsUnread();

      expect(notification.isRead).toBe(false);
      expect(notification.readAt).toBeNull();
      expect(notification.status).toBe(NotificationStatus.Delivered);
    });

    it('should be idempotent when already unread', () => {
      const notification = aNotification();

      notification.markAsUnread();

      expect(notification.isRead).toBe(false);
    });
  });

  describe('cancel()', () => {
    it('should transition Pending to Cancelled', () => {
      const notification = aNotification();

      notification.cancel();

      expect(notification.status).toBe(NotificationStatus.Cancelled);
    });

    it('should transition Sent to Cancelled', async () => {
      const notification = aNotification();
      await notification.send();

      notification.cancel();

      expect(notification.status).toBe(NotificationStatus.Cancelled);
    });

    it('should throw when Delivered', async () => {
      const notification = aNotification();
      await notification.send();
      notification.markAsDelivered();

      expect(() => notification.cancel()).toThrow();
    });

    it('should throw when Read', async () => {
      const notification = aNotification();
      await notification.send();
      notification.markAsDelivered();
      notification.markAsRead();

      expect(() => notification.cancel()).toThrow();
    });
  });

  describe('markAsFailed()', () => {
    it('should transition any status to Failed', async () => {
      const notification = aNotification();

      notification.markAsFailed();

      expect(notification.status).toBe(NotificationStatus.Failed);
    });

    it('should transition Sent to Failed', async () => {
      const notification = aNotification();
      await notification.send();

      notification.markAsFailed();

      expect(notification.status).toBe(NotificationStatus.Failed);
    });
  });

  describe('status helpers', () => {
    it('isPending() returns true for new notifications', () => {
      const notification = aNotification();

      expect(notification.isPending()).toBe(true);
      expect(notification.isSent()).toBe(false);
      expect(notification.isDelivered()).toBe(false);
      expect(notification.hasBeenRead()).toBe(false);
    });

    it('isSent() returns true after sending', async () => {
      const notification = aNotification();
      await notification.send();

      expect(notification.isSent()).toBe(true);
      expect(notification.isPending()).toBe(false);
    });

    it('isDelivered() returns true after delivery', async () => {
      const notification = aNotification();
      await notification.send();
      notification.markAsDelivered();

      expect(notification.isDelivered()).toBe(true);
    });

    it('hasBeenRead() returns true after reading', async () => {
      const notification = aNotification();
      await notification.send();
      notification.markAsDelivered();
      notification.markAsRead();

      expect(notification.hasBeenRead()).toBe(true);
    });
  });

  describe('addChannel() / getChannelByType()', () => {
    it('should add a channel to the notification', async () => {
      const notification = aNotification();
      const channel = NotificationChannel.create({
        notificationId: notification.id,
        channelType: NotificationChannelType.InApp,
      });

      notification.addChannel(channel);

      expect(notification.notificationChannels).toHaveLength(1);
    });

    it('should retrieve a channel by type', () => {
      const notification = aNotification();
      const channel = NotificationChannel.create({
        notificationId: notification.id,
        channelType: NotificationChannelType.Email,
        recipient: 'user@example.com',
      });
      notification.addChannel(channel);

      const found = notification.getChannelByType(NotificationChannelType.Email);

      expect(found).toBeDefined();
      expect(found!.channelType).toBe(NotificationChannelType.Email);
    });

    it('should return undefined for missing channel type', () => {
      const notification = aNotification();

      const found = notification.getChannelByType(NotificationChannelType.Sms);

      expect(found).toBeUndefined();
    });
  });

  describe('toServerDTO()', () => {
    it('should convert to a server DTO', () => {
      const notification = aNotification();

      const dto = notification.toServerDTO();

      expect(dto.id).toBeTruthy();
      expect(dto.identityId).toBe(testIdentityId);
      expect(dto.title).toBe('Test Notification');
      expect(dto.content).toBe('Test notification content');
      expect(dto.type).toBe(NotificationType.Info);
      expect(dto.category).toBe(NotificationCategory.System);
      expect(dto.status).toBe(NotificationStatus.Pending);
      expect(dto.isRead).toBe(false);
      expect(dto.version).toBe(1);
      expect(typeof dto.createdAt).toBe('number');
      expect(typeof dto.updatedAt).toBe('number');
      expect(dto.deletedAt).toBeNull();
    });

    it('should include channels in DTO when present', () => {
      const notification = aNotification();
      const channel = NotificationChannel.create({
        notificationId: notification.id,
        channelType: NotificationChannelType.InApp,
      });
      notification.addChannel(channel);

      const dto = notification.toServerDTO();

      expect(dto.notificationChannels).toHaveLength(1);
      expect(dto.notificationChannels![0].channelType).toBe(NotificationChannelType.InApp);
    });

    it('should return null channels when none exist', () => {
      const notification = aNotification();

      const dto = notification.toServerDTO();

      expect(dto.notificationChannels).toBeNull();
    });
  });

  describe('load()', () => {
    it('should reconstruct from state', () => {
      const original = aNotification();
      const state = {
        id: original.id,
        identityId: original.identityId,
        title: original.title,
        content: original.content,
        type: original.type,
        category: original.category,
        importance: original.importance,
        status: original.status,
        isRead: original.isRead,
        readAt: original.readAt,
        actions: original.actions,
        metadata: original.metadata,
        version: original.version,
        deletedAt: original.deletedAt,
        createdAt: original.createdAt,
        updatedAt: original.updatedAt,
        notificationChannels: [],
      };

      const loaded = Notification.load(state);

      expect(String(loaded.id)).toBe(String(original.id));
      expect(loaded.title).toBe('Test Notification');
      expect(loaded.status).toBe(NotificationStatus.Pending);
    });
  });
});
