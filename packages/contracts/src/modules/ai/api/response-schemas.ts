/**
 * AI - Response Schemas (Zod)
 */

import { z } from 'zod';
import type { GenerateGoalResultDTO } from '../dtos';
import { GoalCategory } from '../dtos/goal-generation-result.dto';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId } from '../../../primitives';

const TokenUsageSchema = z.object({
  promptTokens: z.number(),
  completionTokens: z.number(),
  totalTokens: z.number(),
});

const KeyResultPreviewSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  targetValue: z.number(),
  unit: z.string(),
});

const GeneratedGoalDraftSchema = z.object({
  title: z.string(),
  description: z.string(),
  motivation: z.string().optional(),
  category: z.nativeEnum(GoalCategory),
  suggestedStartDate: z.number(),
  suggestedEndDate: z.number(),
  importance: z.nativeEnum(ImportanceLevel),
  tags: z.array(z.string()),
  feasibilityAnalysis: z.string().optional(),
  aiInsights: z.string().optional(),
});

export const GenerateGoalResultDTOSchema: z.ZodType<GenerateGoalResultDTO> = z.object({
  goal: GeneratedGoalDraftSchema,
  keyResults: z.array(KeyResultPreviewSchema).optional(),
  tokenUsage: TokenUsageSchema,
  providerId: brandedId<AiProviderConfigId>(),
  processingTimeMs: z.number(),
  generatedAt: z.number(),
  providerUsed: z.string().optional(),
  modelUsed: z.string().optional(),
});
