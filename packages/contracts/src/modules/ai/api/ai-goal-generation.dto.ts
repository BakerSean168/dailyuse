/**
 * AI Goal Generation Operations
 * 
 * This file contains DTOs for AI-powered goal generation.
 * Uses AI to generate SMART goals based on user input.
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { GoalId, AiProviderConfigId } from '../../../primitives';
import type { GenerateGoalResultDTO, RefineGoalResultDTO } from '../dtos';

// ============================================================================
// GOAL Generation Operations
// ============================================================================

/**
 * 生成目标 Schema
 */
export const GenerateGoalsSchema = z.object({
  description: z.string().min(10, '描述至少需要 10 个字符'),
  category: z.string().optional(),
  timeframe: z.string().optional(),
  providerId: brandedId<AiProviderConfigId>().optional(),
});

export type GenerateGoalsReq = z.infer<typeof GenerateGoalsSchema>;
export type GenerateGoalsRes = GenerateGoalResultDTO;

/**
 * 优化目标 Schema
 */
export const RefineGoalSchema = z.object({
  goalId: brandedId<GoalId>(),
  feedback: z.string().min(5, '反馈至少需要 5 个字符'),
  providerId: brandedId<AiProviderConfigId>().optional(),
});

export type RefineGoalReq = z.infer<typeof RefineGoalSchema>;
export type RefineGoalRes = RefineGoalResultDTO;
