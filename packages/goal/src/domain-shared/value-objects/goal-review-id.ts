import { createIdType } from '@dailyuse/utils/domain';

import type { GoalReviewId as IGoalReviewId } from '@dailyuse/contracts/primitives';

/**
 * GoalReviewId 值对象
 * 用于强类型化目标评审 ID
 */
export const GoalReviewId = createIdType<IGoalReviewId>('IGoalReviewId');
export type GoalReviewId = IGoalReviewId;
