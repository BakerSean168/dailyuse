/**
 * AI Task Generation Operations
 * 
 * This file contains DTOs for AI-powered task generation.
 * Uses AI to break down goals or key results into actionable tasks.
 */

import { z } from 'zod';
import type { GenerateTasksResultDTO } from '../dtos';

// ============================================================================
// TASK Generation Operations
// ============================================================================

/**
 * 生成任务 Schema
 */
export const GenerateTasksSchema = z.object({
  goalId: z.string().uuid().optional(),
  keyResultId: z.string().uuid().optional(),
  description: z.string().min(10),
  context: z.string().optional(),
  taskCount: z.number().int().min(1).max(10).optional().default(5),
  providerId: z.string().uuid().optional(),
});

export type GenerateTasksReq = z.infer<typeof GenerateTasksSchema>;
export type GenerateTasksRes = GenerateTasksResultDTO;
