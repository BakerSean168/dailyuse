import { createIdType } from '@memoflow/utils/domain';

import type { NotificationId as INotificationId } from '@memoflow/contracts/primitives';

/**
 * NotificationId 值对象
 * 用于强类型化通知 ID
 */
export const NotificationId = createIdType<INotificationId>('INotificationId');
export type NotificationId = INotificationId;
