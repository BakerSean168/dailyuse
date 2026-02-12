import { NotificationService } from '@dailyuse/notification/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('markAsReadService');

export async function markAsReadService(uuid: string): Promise<void> {
  await NotificationService.getInstance().markAsRead(uuid);
}
