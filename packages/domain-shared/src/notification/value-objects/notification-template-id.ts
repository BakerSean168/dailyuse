import { createIdType } from '@dailyuse/utils';

import type { NotificationTemplateId as INotificationTemplateId } from '@dailyuse/contracts/primitives';

/**
 * NotificationTemplateId 值对象
 * 用于强类型化通知模板 ID
 */
export const NotificationTemplateId = createIdType<INotificationTemplateId>('INotificationTemplateId');
export type NotificationTemplateId = INotificationTemplateId;
