import { NotificationService } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('markAsReadService');

export async function markAsReadService(uuid: string): Promise<void> {
  await NotificationService.getInstance().markAsRead(uuid);
}
