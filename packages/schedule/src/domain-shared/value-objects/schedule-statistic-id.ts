import { createIdType } from '@dailyuse/utils';

import type { ScheduleStatisticId as IScheduleStatisticId } from '@dailyuse/contracts/primitives';

/**
 * ScheduleStatisticId 值对象
 * 用于强类型化日程统计 ID
 */
export const ScheduleStatisticId = createIdType<IScheduleStatisticId>('IScheduleStatisticId');
export type ScheduleStatisticId = IScheduleStatisticId;
