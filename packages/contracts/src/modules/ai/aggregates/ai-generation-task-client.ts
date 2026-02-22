/**
 * AIGenerationTask Aggregate Root - Client Interface
 * AI生成任务聚合?- 客户端接?
 */

import type { AiGenerationTaskId, IdentityId, TransferDate, DomainDate } from '@/primitives';
import type { GenerationTaskType } from '../value-objects/generation-task-type';
import type { TaskStatus } from '../value-objects/task-status';
import type { AIGenerationTaskServerDTO } from './ai-generation-task-server';
import type { GenerationInputClientDTO, GenerationResultClientDTO } from '../value-objects';

// ============ DTO 定义 ============

export interface AIGenerationTaskClientDTO {
  id: AiGenerationTaskId;
  identityId: IdentityId;
  type: GenerationTaskType;
  status: TaskStatus;
  input: GenerationInputClientDTO;
  result: GenerationResultClientDTO | null;
  error: string | null;
  version: number;
  createdAt: TransferDate;
  updatedAt: TransferDate;
  deletedAt: TransferDate | null;
  completedAt: TransferDate | null;

  // UI 计算字段
  isPending: boolean;
  isProcessing: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  statusText: string;
  typeText: string;
  durationMs: number | null;
  formattedCreatedAt: string;
  formattedCompletedAt: string | null;
}
