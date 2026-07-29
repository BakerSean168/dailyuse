import { createIdType } from '@memoflow/utils/domain';

import type { NotificationTemplateId as INotificationTemplateId } from '@memoflow/contracts/primitives';

/**
 * NotificationTemplateId 值对象
 * 用于强类型化通知模板 ID
 */
export const NotificationTemplateId = createIdType<INotificationTemplateId>('INotificationTemplateId');
export type NotificationTemplateId = INotificationTemplateId;
