import { createIdType } from '@dailyuse/utils';

import type { TaskInstanceId as ITaskInstanceId } from '@dailyuse/contracts/primitives';

/**
 * TaskInstanceId 值对象
 * 用于强类型化任务实例 ID
 */
export const TaskInstanceId = createIdType<ITaskInstanceId>('ITaskInstanceId');
export type TaskInstanceId = ITaskInstanceId;
