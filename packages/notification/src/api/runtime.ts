import { createLogger } from '@dailyuse/utils';
import type { NotificationModuleRuntimeContribution } from '../infrastructure-server';

const logger = createLogger('NotificationRuntime');

export type NotificationRuntimeContribution = NotificationModuleRuntimeContribution;

export function createNotificationRuntimeContribution(): NotificationRuntimeContribution {
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
