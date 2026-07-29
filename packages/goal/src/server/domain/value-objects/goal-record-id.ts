import { createIdType } from '@memoflow/utils/domain';

import type { GoalRecordId as IGoalRecordId } from '@memoflow/contracts/primitives';

/**
 * GoalRecordId 值对象
 * 用于强类型化目标记录 ID
 */
export const GoalRecordId = createIdType<IGoalRecordId>('IGoalRecordId');
export type GoalRecordId = IGoalRecordId;
