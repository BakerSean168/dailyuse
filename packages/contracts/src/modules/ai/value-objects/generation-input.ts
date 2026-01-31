/**
 * GenerationInput Value Object
 * 生成输入值对象
 */

import type { GenerationTaskType } from './generation-task-type';

// ============ Client DTO ============

export interface GenerationInputClientDTO {
  prompt: string;
  systemPrompt: string | null;
  taskType: GenerationTaskType;
  temperature: number | null;
  maxTokens: number | null;
  contextData: Record<string, unknown> | null;
}

// ============ Server DTO ============

export interface GenerationInputServerDTO {
  prompt: string;
  systemPrompt: string | null;
  taskType: GenerationTaskType;
  temperature: number | null;
  maxTokens: number | null;
  contextData: Record<string, unknown> | null;
}

export interface GenerationInputPersistenceDTO {
  prompt: string;
  systemPrompt: string | null;
  taskType: GenerationTaskType;
  temperature: number | null;
  maxTokens: number | null;
  contextData: string | null; // JSON string
}
