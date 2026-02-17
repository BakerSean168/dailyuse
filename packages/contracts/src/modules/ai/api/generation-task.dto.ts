/**
 * AI Generation Task Operations
 *
 * This file contains DTOs for managing long-running AI generation tasks.
 * Includes starting, checking status, and canceling generation tasks.
 */

import { z } from 'zod';
import { brandedId } from '@/primitives';
import type { AiProviderConfigId } from '@/primitives';
import type { AIGenerationTaskClientDTO } from '../aggregates/ai-generation-task-client';

// ============================================================================
// GENERATION TASK Operations
// ============================================================================

/**
 * 启动生成任务 Schema
 */
export const StartGenerationTaskSchema = z.object({
  taskType: z.enum(['TEXT_GENERATION', 'IMAGE_GENERATION', 'CODE_GENERATION', 'DATA_ANALYSIS']),
  prompt: z.string().min(1),
  parameters: z.record(z.string(), z.any()).optional(),
  providerId: brandedId<AiProviderConfigId>().optional(),
});

export type StartGenerationTaskReq = z.infer<typeof StartGenerationTaskSchema>;
export type StartGenerationTaskRes = AIGenerationTaskClientDTO;

/**
 * 获取任务状态
 */
export type GetGenerationTaskStatusReq = void;
export type GetGenerationTaskStatusRes = AIGenerationTaskClientDTO;

/**
 * 取消任务
 */
export type CancelGenerationTaskReq = void;
export type CancelGenerationTaskRes = AIGenerationTaskClientDTO;
