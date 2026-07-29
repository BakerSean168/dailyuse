import { createIdType } from '@memoflow/utils/domain';

import type { ReminderResponseId as IReminderResponseId } from '@memoflow/contracts/primitives';

/**
 * ReminderResponseId 值对象
 * 用于强类型化提醒响应 ID
 */
export const ReminderResponseId = createIdType<IReminderResponseId>('IReminderResponseId');
export type ReminderResponseId = IReminderResponseId;
