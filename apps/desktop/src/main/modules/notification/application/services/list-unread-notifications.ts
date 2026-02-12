import { NotificationService } from '@dailyuse/notification/application-server';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listUnreadNotificationsService');

export async function listUnreadNotificationsService(
  accountUuid: string,
  limit?: number,
): Promise<NotificationClientDTO[]> {
  return NotificationService.getInstance().getUnreadNotifications(accountUuid, { limit });
}
