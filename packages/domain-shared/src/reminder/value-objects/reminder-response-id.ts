import { createIdType } from '@dailyuse/utils';

import type { ReminderResponseId as IReminderResponseId } from '@dailyuse/contracts/primitives';

/**
 * ReminderResponseId 值对象
 * 用于强类型化提醒响应 ID
 */
export const ReminderResponseId = createIdType<IReminderResponseId>('IReminderResponseId');
export type ReminderResponseId = IReminderResponseId;
