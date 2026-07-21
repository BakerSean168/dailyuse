import type {
  CleanupOldNotificationsReq,
  DeleteNotificationsBatchReq,
  NotificationCategory,
} from '@dailyuse/contracts/notification';
import type { Result } from '@dailyuse/contracts/result';
import { fail, ok } from '@dailyuse/contracts/result';
import type { INotificationRepository } from '../../domain/repositories';

interface CleanupOldNotificationsCommand extends CleanupOldNotificationsReq {
  identityId: string;
}

export class NotificationMaintenanceApplicationService {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async deleteNotification(id: string): Promise<Result<void>> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      return fail({ code: 'NOT_FOUND', message: 'notification not found' });
    }

    notification.softDelete();
    await this.notificationRepository.save(notification);

    return ok(undefined);
  }

  async batchDelete(
    data: DeleteNotificationsBatchReq,
  ): Promise<Result<{ deletedCount: number }>> {
    const notifications = await Promise.all(
      data.notificationIds.map((id) => this.notificationRepository.findById(id)),
    );
    const existingNotifications = notifications.filter(
      (notification): notification is NonNullable<typeof notification> => notification !== null,
    );

    for (const notification of existingNotifications) {
      notification.softDelete();
    }

    await this.notificationRepository.saveMany(existingNotifications);

    return ok({
      deletedCount: existingNotifications.length,
    });
  }

  async cleanupOldNotifications(
    data: CleanupOldNotificationsCommand,
  ): Promise<Result<{ deletedCount: number }>> {
    const beforeTimestamp = Date.now() - data.beforeDays * 24 * 60 * 60 * 1000;
    const notifications = await this.notificationRepository.findByIdentityId(data.identityId, {
      includeDeleted: false,
      includeRead: true,
    });
    const expiredIds = notifications
      .map((notification) => notification.toServerDTO())
      .filter((notification) => this.matchesCategory(notification.category, data.category))
      .filter((notification) => notification.expiresAt != null && notification.expiresAt < beforeTimestamp)
      .map((notification) => String(notification.id));

    if (expiredIds.length > 0) {
      await this.notificationRepository.deleteMany(expiredIds);
    }

    return ok({
      deletedCount: expiredIds.length,
    });
  }

  private matchesCategory(
    actualCategory: NotificationCategory,
    expectedCategory?: NotificationCategory,
  ): boolean {
    return !expectedCategory || actualCategory === expectedCategory;
  }
}