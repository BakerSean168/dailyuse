import { createIdType } from '@dailyuse/utils/domain';

import type { ReminderGroupId as IReminderGroupId } from '@dailyuse/contracts/primitives';

/**
 * ReminderGroupId 值对象
 * 用于强类型化提醒分组 ID
 */
export const ReminderGroupId = createIdType<IReminderGroupId>('IReminderGroupId');
export type ReminderGroupId = IReminderGroupId;
