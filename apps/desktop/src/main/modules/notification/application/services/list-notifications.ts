import { NotificationService } from '@dailyuse/notification/application-server';
import type { NotificationClientDTO } from '@dailyuse/contracts/notification';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('listNotificationsService');

export async function listNotificationsService(
  accountUuid: string,
  options?: { includeRead?: boolean; limit?: number; offset?: number },
): Promise<NotificationClientDTO[]> {
  return NotificationService.getInstance().getUserNotifications(accountUuid, options);
}
