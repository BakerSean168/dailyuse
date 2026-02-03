import { createIdType } from '@dailyuse/utils';

import type { ScheduleId as IScheduleId } from '@dailyuse/contracts/primitives';

/**
 * ScheduleId 值对象
 * 用于强类型化日程 ID
 */
export const ScheduleId = createIdType<IScheduleId>('IScheduleId');
export type ScheduleId = IScheduleId;
