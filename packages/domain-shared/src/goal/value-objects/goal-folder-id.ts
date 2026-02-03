import { createIdType } from '@dailyuse/utils';

import type { GoalFolderId as IGoalFolderId } from '@dailyuse/contracts/primitives';

/**
 * GoalFolderId 值对象
 * 用于强类型化目标文件夹 ID
 */
export const GoalFolderId = createIdType<IGoalFolderId>('IGoalFolderId');
export type GoalFolderId = IGoalFolderId;
