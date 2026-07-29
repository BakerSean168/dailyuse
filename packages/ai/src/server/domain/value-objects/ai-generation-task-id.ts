import { createIdType } from '@memoflow/utils/domain';

import type { AiGenerationTaskId as IAiGenerationTaskId } from '@memoflow/contracts/primitives';

/**
 * AiGenerationTaskId 值对象
 * 用于强类型化 AI 生成任务 ID
 */
export const AiGenerationTaskId = createIdType<IAiGenerationTaskId>('IAiGenerationTaskId');
export type AiGenerationTaskId = IAiGenerationTaskId;
