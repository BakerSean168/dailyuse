import { createIdType } from '@memoflow/utils/domain';

import type { TaskInstanceId as ITaskInstanceId } from '@memoflow/contracts/primitives';

/**
 * TaskInstanceId 值对象
 * 用于强类型化任务实例 ID
 */
export const TaskInstanceId = createIdType<ITaskInstanceId>('ITaskInstanceId');
export type TaskInstanceId = ITaskInstanceId;
