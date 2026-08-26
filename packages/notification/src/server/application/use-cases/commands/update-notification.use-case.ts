import type {
  NotificationClientDTO,
  NotificationMetadataDTO,
  UpdateNotificationReq,
} from '@memoflow/contracts/notification';
import type { Result } from '@memoflow/contracts/result';
import { error, ok } from '@memoflow/contracts/result';
import type { INotificationRepository } from '../../../domain/repositories';
import { toNotificationClientDTO } from './notification-dto-converters';

/** Fact-only update. Delivery lifecycle is immutable from this command. */
export class UpdateNotificationUseCase {
  constructor(private readonly notificationRepository: INotificationRepository) {}

  async execute(
    id: string,
    identityId: string,
    patch: UpdateNotificationReq,
  ): Promise<Result<NotificationClientDTO>> {
    const notification = await this.notificationRepository.findByIdForIdentity(identityId, id);
    if (!notification) return error('NOT_FOUND', 'notification not found');

    notification.updateDetails({
      title: patch.title,
      content: patch.content,
      importance: patch.importance,
      urgency: patch.urgency,
      navigationIntent: patch.navigationIntent,
      metadata: patch.metadata as NotificationMetadataDTO | undefined,
      expiresAt: patch.expiresAt,
    });
    await this.notificationRepository.save(notification);
    return ok(toNotificationClientDTO(notification.toServerDTO()));
  }
}
