import { createIdType } from '@dailyuse/utils/domain';

import type { TaskDependencyId as ITaskDependencyId } from '@dailyuse/contracts/primitives';

/**
 * TaskDependencyId 值对象
 * 用于强类型化任务依赖 ID
 */
export const TaskDependencyId = createIdType<ITaskDependencyId>('ITaskDependencyId');
export type TaskDependencyId = ITaskDependencyId;
