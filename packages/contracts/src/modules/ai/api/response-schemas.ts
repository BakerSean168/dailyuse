import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId } from '../../../primitives';
import { GoalCategory } from '../dtos/goal-generation-result.dto';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import { KeyResultCalculationMethod } from '../../goal/value-objects/key-result-calculation-method';
import { KeyResultValueType } from '../../goal/value-objects/key-result-value-type';

const TokenUsageSchema = z.object({
  promptTokens: z.number(),
  completionTokens: z.number(),
  totalTokens: z.number(),
});

const KeyResultPreviewSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  valueType: z.enum(KeyResultValueType),
  calculationMethod: z.enum(KeyResultCalculationMethod),
  startValue: z.number(),
  currentValue: z.number(),
  targetValue: z.number(),
  unit: z.string(),
  weight: z.number().int().min(1).max(5),
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
