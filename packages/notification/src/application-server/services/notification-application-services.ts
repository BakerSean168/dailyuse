/**
 * Notification Application Service - Stub
 * 
 * @deprecated This file contains multiple service classes which violates Single Responsibility.
 * Use individual use-case services instead:
 * - NotificationApplicationService.send() -> use create-notification.ts
 * - NotificationTemplateApplicationService -> extract to separate use-cases
 * - NotificationChannelApplicationService -> extract to separate use-cases
 * 
 * DDD Refactoring Rationale:
 * - Multiple classes in one file violates separation of concerns
 * - Each service should be in its own file
 * - Each business operation should have its own use-case
 * 
 * Current individual services available:
 * - create-notification.ts
 * - mark-notification-as-read.ts
 * - get-user-notifications.ts
 * - get-unread-notifications.ts
 * - get-notification-preference.ts
 */
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationApplicationService');

/**
 * @deprecated Use create-notification.ts instead
 */
export class NotificationApplicationService {
  constructor() {}

  async send(params: any): Promise<any> {
    logger.info('Sending notification');
    return { success: true };
  }
}

/**
 * @deprecated Extract template operations to individual use-case files
 */
export class NotificationTemplateApplicationService {
  constructor() {}

  async createTemplate(params: any): Promise<any> {
    logger.info('Creating notification template');
    return { uuid: 'template-' + Date.now() };
  }
}

/**
 * @deprecated Extract channel configuration to individual use-case files
 */
export class NotificationChannelApplicationService {
  constructor() {}

  async configureChannel(params: any): Promise<any> {
    logger.info('Configuring notification channel');
    return { success: true };
  }
}
