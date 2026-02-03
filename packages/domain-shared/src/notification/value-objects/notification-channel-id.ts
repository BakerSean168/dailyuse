import { createIdType } from '@dailyuse/utils';

import type { NotificationChannelId as INotificationChannelId } from '@dailyuse/contracts/primitives';

/**
 * NotificationChannelId 值对象
 * 用于强类型化通知渠道 ID
 */
export const NotificationChannelId = createIdType<INotificationChannelId>('INotificationChannelId');
export type NotificationChannelId = INotificationChannelId;
