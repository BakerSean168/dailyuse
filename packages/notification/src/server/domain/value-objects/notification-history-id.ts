import { createIdType } from '@memoflow/utils/domain';

import type { NotificationHistoryId as INotificationHistoryId } from '@memoflow/contracts/primitives';

/**
 * NotificationHistoryId 值对象
 * 用于强类型化通知历史 ID
 */
export const NotificationHistoryId = createIdType<INotificationHistoryId>('NotificationHistoryId');
export type NotificationHistoryId = INotificationHistoryId;
