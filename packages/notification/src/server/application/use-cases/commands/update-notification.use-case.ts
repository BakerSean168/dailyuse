import type {
  NotificationClientDTO,
  NotificationMetadataDTO,
  NotificationStatus,
  UpdateNotificationReq,
} from '@dailyuse/contracts/notification';
import type { Result } from '@dailyuse/contracts/result';
import { error, ok } from '@dailyuse/contracts/result';
import type { INotificationRepository } from '../../../domain/repositories';
import { toNotificationClientDTO } from './notification-dto-converters';

export class UpdateNotificationUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(
    id: string,
    identityId: string,
    patch: UpdateNotificationReq,
  ): Promise<Result<NotificationClientDTO>> {
    const notification = await this.notificationRepository.findByIdForIdentity(identityId, id);
    if (!notification) {
      return error('NOT_FOUND', 'notification not found');
    }

    notification.updateDetails({
      title: patch.title,
      content: patch.content,
      status: patch.status as NotificationStatus | undefined,
      metadata: patch.metadata as NotificationMetadataDTO | undefined,
      expiresAt: patch.expiresAt,
    });

    await this.notificationRepository.save(notification);

    return ok(toNotificationClientDTO(notification.toServerDTO()));
  }
}
