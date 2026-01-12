import { NotificationService } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('markAllAsReadService');

export async function markAllAsReadService(accountUuid: string): Promise<void> {
  await NotificationService.getInstance().markAllAsRead(accountUuid);
}
