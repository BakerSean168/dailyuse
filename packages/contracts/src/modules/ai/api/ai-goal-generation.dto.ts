/**
 * AI Goal Generation Operations
 * 
 * This file contains DTOs for AI-powered goal and key result generation.
 * Uses AI to help users create structured goals and measurable key results.
 */

import { z } from 'zod';
import type { GenerateGoalResultDTO, GenerateKeyResultsResultDTO } from '../dtos';

// ============================================================================
// GOAL Generation Operations
// ============================================================================

/**
 * 生成目标 Schema
 */
export const GenerateGoalSchema = z.object({
  idea: z.string().min(10, '想法描述至少需要 10 个字符'),
  category: z.enum(['work', 'health', 'learning', 'personal', 'finance', 'relationship', 'other']).optional(),
  timeframe: z.object({
    startDate: z.number().int().optional(),
    endDate: z.number().int().optional(),
  }).optional(),
  context: z.string().optional(),
  providerId: z.string().uuid().optional(),
  includeKeyResults: z.boolean().optional().default(false),
  keyResultCount: z.number().int().min(3).max(5).optional().default(3),
});

export type GenerateGoalReq = z.infer<typeof GenerateGoalSchema>;
export type GenerateGoalRes = GenerateGoalResultDTO;

/**
 * 生成 Key Results Schema
 */
export const GenerateKeyResultsSchema = z.object({
  goalId: z.string().uuid(),
  goalTitle: z.string(),
  goalDescription: z.string().optional(),
  count: z.number().int().min(3).max(5).optional().default(3),
  providerId: z.string().uuid().optional(),
});

export type GenerateKeyResultsReq = z.infer<typeof GenerateKeyResultsSchema>;
export type GenerateKeyResultsRes = GenerateKeyResultsResultDTO;
