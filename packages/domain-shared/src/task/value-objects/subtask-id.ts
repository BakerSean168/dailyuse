import { createIdType } from '@dailyuse/utils';

import type { SubtaskId as ISubtaskId } from '@dailyuse/contracts/primitives';

/**
 * SubtaskId 值对象
 * 用于强类型化子任务 ID
 */
export const SubtaskId = createIdType<ISubtaskId>('ISubtaskId');
export type SubtaskId = ISubtaskId;
