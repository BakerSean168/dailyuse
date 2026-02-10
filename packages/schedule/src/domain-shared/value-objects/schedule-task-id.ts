import { createIdType } from '@dailyuse/utils';

import type { ScheduleTaskId as IScheduleTaskId } from '@dailyuse/contracts/primitives';

/**
 * ScheduleTaskId 值对象
 * 用于强类型化日程任务 ID
 */
export const ScheduleTaskId = createIdType<IScheduleTaskId>('IScheduleTaskId');
export type ScheduleTaskId = IScheduleTaskId;
