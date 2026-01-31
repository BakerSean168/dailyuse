/**
 * GenerationResult Value Object
 * 生成结果值对象
 */

import type { GenerationTaskType } from './generation-task-type';

// ============ Client DTO ============

export interface GenerationResultClientDTO {
  content: string;
  taskType: GenerationTaskType;
  metadata: Record<string, unknown> | null;
  generatedAt: number;
}

// ============ Server DTO ============

export interface GenerationResultServerDTO {
  content: string;
  taskType: GenerationTaskType;
  metadata: Record<string, unknown> | null;
  generatedAt: number;
}

export interface GenerationResultPersistenceDTO {
  content: string;
  taskType: GenerationTaskType;
  metadata: string | null; // JSON string
  generatedAt: number;
}
