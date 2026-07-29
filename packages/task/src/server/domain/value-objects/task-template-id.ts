import { createIdType } from '@memoflow/utils/domain';

import type { TaskTemplateId as ITaskTemplateId } from '@memoflow/contracts/primitives';

/**
 * TaskTemplateId 值对象
 * 用于强类型化任务模板 ID
 */
export const TaskTemplateId = createIdType<ITaskTemplateId>('ITaskTemplateId');
export type TaskTemplateId = ITaskTemplateId;
