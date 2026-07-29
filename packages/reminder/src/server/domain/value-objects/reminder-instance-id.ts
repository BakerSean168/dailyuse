import { createIdType } from '@memoflow/utils/domain';

import type { ReminderInstanceId as IReminderInstanceId } from '@memoflow/contracts/primitives';

/**
 * ReminderInstanceId 值对象
 * 用于强类型化提醒实例 ID
 */
export const ReminderInstanceId = createIdType<IReminderInstanceId>('IReminderInstanceId');
export type ReminderInstanceId = IReminderInstanceId;
