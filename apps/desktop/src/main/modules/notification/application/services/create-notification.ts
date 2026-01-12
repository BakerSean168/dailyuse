import { NotificationService } from '@dailyuse/application-server';
import type { CreateNotificationRequest, NotificationClientDTO } from '@dailyuse/contracts/notification';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('createNotificationService');

export async function createNotificationService(
  input: CreateNotificationRequest,
): Promise<NotificationClientDTO> {
  logger.debug('Creating notification', { title: input.title });
  return NotificationService.getInstance().createNotification(input);
}
