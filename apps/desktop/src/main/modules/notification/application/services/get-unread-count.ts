import { NotificationService } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('getUnreadCountService');

export async function getUnreadCountService(accountUuid: string): Promise<number> {
  return NotificationService.getInstance().getUnreadCount(accountUuid);
}
