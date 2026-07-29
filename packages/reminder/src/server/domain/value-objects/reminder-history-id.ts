import { createIdType } from '@memoflow/utils/domain';

import type { ReminderHistoryId as IReminderHistoryId } from '@memoflow/contracts/primitives';

/**
 * ReminderHistoryId 值对象
 * 用于强类型化提醒历史 ID
 */
export const ReminderHistoryId = createIdType<IReminderHistoryId>('IReminderHistoryId');
export type ReminderHistoryId = IReminderHistoryId;
