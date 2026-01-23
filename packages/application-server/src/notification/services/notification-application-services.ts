/**
 * Notification Application Service - Stub
 */
import { createLogger } from '@dailyuse/utils';

const logger = createLogger('NotificationApplicationService');

export class NotificationApplicationService {
  constructor() {}

  async send(params: any): Promise<any> {
    logger.info('Sending notification');
    return { success: true };
  }
}

export class NotificationTemplateApplicationService {
  constructor() {}

  async createTemplate(params: any): Promise<any> {
    logger.info('Creating notification template');
    return { uuid: 'template-' + Date.now() };
  }
}

export class NotificationChannelApplicationService {
  constructor() {}

  async configureChannel(params: any): Promise<any> {
    logger.info('Configuring notification channel');
    return { success: true };
  }
}
