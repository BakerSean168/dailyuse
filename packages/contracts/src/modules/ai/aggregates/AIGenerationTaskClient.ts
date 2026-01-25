/**
 * AIGenerationTask Aggregate Root - Client Interface
 * AI生成任务聚合根 - 客户端接口
 */

import type { GenerationTaskType, TaskStatus } from '../enums';
import type { AIGenerationTaskServerDTO } from './AIGenerationTaskServer';
import type { GenerationInputClientDTO, GenerationResultClientDTO } from '../value-objects';

// ============ DTO 定义 ============

export interface AIGenerationTaskClientDTO {
  uuid: string;
  accountUuid: string;
  type: GenerationTaskType;
  status: TaskStatus;
  input: GenerationInputClientDTO;
  result?: GenerationResultClientDTO | null;
  error?: string | null;
  createdAt: number;
  completedAt?: number | null;

  // UI 计算字段
  isPending: boolean;
  isProcessing: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  statusText: string;
  typeText: string;
  durationMs?: number | null;
  formattedCreatedAt: string;
  formattedCompletedAt?: string | null;
}

// ============ 实体接口 ============

export interface AIGenerationTaskClient {
  uuid: string;
  accountUuid: string;
  type: GenerationTaskType;
  status: TaskStatus;
  input: GenerationInputClientDTO;
  result?: GenerationResultClientDTO | null;
  error?: string | null;
  createdAt: Date;
  completedAt?: Date | null;

  isPending: boolean;
  isProcessing: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  statusText: string;
  typeText: string;
  durationMs?: number | null;
  formattedCreatedAt: string;
  formattedCompletedAt?: string | null;

  getStatusBadge(): string;
  getTypeBadge(): string;
  hasResult(): boolean;
  hasError(): boolean;
  canRetry(): boolean;

  toClientDTO(): AIGenerationTaskClientDTO;
  toServerDTO(): AIGenerationTaskServerDTO;
}

export interface AIGenerationTaskClientStatic {
  fromClientDTO(dto: AIGenerationTaskClientDTO): AIGenerationTaskClient;
  fromServerDTO(dto: AIGenerationTaskServerDTO): AIGenerationTaskClient;
  forCreate(accountUuid: string, type: GenerationTaskType, input: GenerationInputClientDTO): AIGenerationTaskClient;
}

export interface AIGenerationTaskClientInstance extends AIGenerationTaskClient {
  clone(): AIGenerationTaskClient;
}
