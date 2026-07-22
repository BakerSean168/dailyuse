import { createLogger } from '@dailyuse/utils/logger';
import type { NotificationModuleRuntimeContribution } from '../notification.module';

const logger = createLogger('NotificationRuntime');

export function createNotificationRuntimeContribution(): NotificationModuleRuntimeContribution {
  let started = false;

  return {
    start(): void {
      if (started) {
        return;
      }

      started = true;
      logger.info('[Notification] Runtime contribution started');
    },

    stop(): void {
      if (!started) {
        return;
      }

      started = false;
      logger.info('[Notification] Runtime contribution stopped');
    },
  };
}
