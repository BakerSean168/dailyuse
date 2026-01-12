import { NotificationService } from '@dailyuse/application-server';
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('deleteNotificationService');

export async function deleteNotificationService(uuid: string, soft = true): Promise<void> {
  await NotificationService.getInstance().deleteNotification(uuid, soft);
}
