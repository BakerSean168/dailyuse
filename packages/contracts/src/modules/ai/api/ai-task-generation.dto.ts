/**
 * AI Task Generation Operations
 * 
 * This file contains DTOs for AI-powered task generation.
 * Uses AI to break down goals or key results into actionable tasks.
 */

import { z } from 'zod';
import { brandedId } from '@/primitives';
import type { GoalId, KeyResultId, AiProviderConfigId } from '@/primitives';
import type { GenerateTasksResultDTO } from '../dtos';

// ============================================================================
// TASK Generation Operations
// ============================================================================

/**
 * 生成任务 Schema
 */
export const GenerateTasksSchema = z.object({
  goalId: brandedId<GoalId>().optional(),
  keyResultId: brandedId<KeyResultId>().optional(),
  description: z.string().min(10),
  context: z.string().optional(),
  taskCount: z.number().int().min(1).max(10).default(5).optional(),
  providerId: brandedId<AiProviderConfigId>().optional(),
});

export type GenerateTasksReq = z.infer<typeof GenerateTasksSchema>;
export type GenerateTasksRes = GenerateTasksResultDTO;
