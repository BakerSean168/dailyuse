/**
 * Mark Notification As Read Service
 *
 * 标记通知为已读的应用服务
 */

import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type {
  INotificationRepository,
} from '../../../domain/repositories';
import { toNotificationClientDTO } from './notification-dto-converters';

/**
 * Mark Notification As Read Use Case
 */
export class MarkNotificationAsReadUseCase {
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(id: string): Promise<Result<NotificationClientDTO>> {
    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      return error('NOT_FOUND', `Notification not found: ${id}`);
    }

    notification.markAsRead();
    await this.notificationRepository.save(notification);

    return ok(toNotificationClientDTO(notification.toServerDTO()));
  }

  async executeMany(ids: string[]): Promise<Result<number>> {
    const notifications = (
      await Promise.all(ids.map((id) => this.notificationRepository.findById(id)))
    ).filter((notification): notification is NonNullable<typeof notification> => notification !== null);

    for (const notification of notifications) {
      notification.markAsRead();
    }

    await this.notificationRepository.saveMany(notifications);

    return ok(notifications.length);
  }

  async executeAll(identityId: string): Promise<Result<number>> {
    const notifications = await this.notificationRepository.findUnread(identityId);

    for (const notification of notifications) {
      notification.markAsRead();
    }

    await this.notificationRepository.saveMany(notifications);

    return ok(notifications.length);
  }
}
