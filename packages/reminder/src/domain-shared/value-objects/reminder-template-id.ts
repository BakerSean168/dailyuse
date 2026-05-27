import { createIdType } from '@dailyuse/utils/domain';

import type { ReminderTemplateId as IReminderTemplateId } from '@dailyuse/contracts/primitives';

/**
 * ReminderTemplateId 值对象
 * 用于强类型化提醒模板 ID
 */
export const ReminderTemplateId = createIdType<IReminderTemplateId>('IReminderTemplateId');
export type ReminderTemplateId = IReminderTemplateId;
