import { createIdType } from '@dailyuse/utils';

import type { TaskFolderId as ITaskFolderId } from '@dailyuse/contracts/primitives';

/**
 * TaskFolderId 值对象
 * 用于强类型化任务文件夹 ID
 */
export const TaskFolderId = createIdType<ITaskFolderId>('ITaskFolderId');
export type TaskFolderId = ITaskFolderId;
