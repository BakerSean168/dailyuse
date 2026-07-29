import { createIdType } from '@memoflow/utils/domain';

import type { SubtaskId as ISubtaskId } from '@memoflow/contracts/primitives';

/**
 * SubtaskId 值对象
 * 用于强类型化子任务 ID
 */
export const SubtaskId = createIdType<ISubtaskId>('ISubtaskId');
export type SubtaskId = ISubtaskId;
