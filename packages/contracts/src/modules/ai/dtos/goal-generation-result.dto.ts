/**
 * Generated Goal Draft DTO
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId } from '../../../primitives';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import { KeyResultCalculationMethod } from '../../goal/value-objects/key-result-calculation-method';
import { KeyResultValueType } from '../../goal/value-objects/key-result-value-type';
import { TokenUsageSchema } from '../value-objects/token-usage';

export enum GoalCategory {
  WORK = 'work',
  HEALTH = 'health',
  LEARNING = 'learning',
  PERSONAL = 'personal',
  FINANCE = 'finance',
  RELATIONSHIP = 'relationship',
  OTHER = 'other',
}

// Residual 719: goal draft / key-result preview schemas are the sole shapes
// Residual 727: tokenUsage reuses shared TokenUsageSchema (no local dual schema).
// (GeneratedGoalDraft / KeyResultPreview / GenerateGoalResultDTO /
// GenerateKeyResultsResultDTO are z.infer aliases).
export const GeneratedGoalDraftSchema = z.object({
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

export const KeyResultPreviewSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  valueType: z.enum(Object.values(KeyResultValueType)),
  calculationMethod: z.enum(Object.values(KeyResultCalculationMethod)),
  startValue: z.number(),
  currentValue: z.number(),
  targetValue: z.number(),
  unit: z.string(),
  weight: z.number().int().min(1).max(5),
});

export const GenerateGoalResultDTOSchema = z.object({
  goal: GeneratedGoalDraftSchema,
  keyResults: z.array(KeyResultPreviewSchema).optional(),
  tokenUsage: TokenUsageSchema,
  providerId: brandedId<AiProviderConfigId>(),
  processingTimeMs: z.number(),
  generatedAt: z.number(),
  providerUsed: z.string().optional(),
  modelUsed: z.string().optional(),
});

export const GenerateKeyResultsResultDTOSchema = z.object({
  keyResults: z.array(KeyResultPreviewSchema),
  tokenUsage: TokenUsageSchema,
  providerId: brandedId<AiProviderConfigId>(),
  processingTimeMs: z.number(),
  generatedAt: z.number(),
});

export type GeneratedGoalDraft = z.infer<typeof GeneratedGoalDraftSchema>;
export type KeyResultPreview = z.infer<typeof KeyResultPreviewSchema>;
export type GenerateGoalResultDTO = z.infer<typeof GenerateGoalResultDTOSchema>;
export type GenerateKeyResultsResultDTO = z.infer<typeof GenerateKeyResultsResultDTOSchema>;
