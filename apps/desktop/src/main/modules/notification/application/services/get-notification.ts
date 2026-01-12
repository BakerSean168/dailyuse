import { NotificationService } from '@dailyuse/application-server';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getNotificationService');

export async function getNotificationService(
  uuid: string,
  includeChildren = false,
): Promise<NotificationClientDTO | null> {
  return NotificationService.getInstance().getNotification(uuid, { includeChildren });
}
