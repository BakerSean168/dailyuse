import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId } from '../../../primitives';
import { GoalCategory } from '../dtos/goal-generation-result.dto';
import {
  GoalAutomationActionSchema,
  GoalAutomationExecutedActionSchema,
} from './ai-goal-automation.dto';
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

const GoalClarificationQuestionSchema = z.object({
  question: z.string(),
  context: z.string().nullable().optional(),
});

const GoalClarificationSchema = z.object({
  needsClarification: z.literal(true),
  questions: z.array(GoalClarificationQuestionSchema).min(2).max(4),
  rationale: z.string().nullable().optional(),
});

export const GoalWorkflowDraftResultDTOSchema = GenerateGoalResultDTOSchema.extend({
  state: z.literal('draft'),
});

export const GoalWorkflowClarificationResultDTOSchema = z.object({
  state: z.literal('clarification'),
  clarification: GoalClarificationSchema,
  tokenUsage: TokenUsageSchema,
  providerId: brandedId<AiProviderConfigId>(),
  processingTimeMs: z.number(),
  generatedAt: z.number(),
  providerUsed: z.string().optional(),
  modelUsed: z.string().optional(),
});

const GoalWorkflowPlanPayloadSchema = z.object({
  summary: z.string(),
  plan: z.object({
    goal: GeneratedGoalDraftSchema,
    keyResults: z.array(KeyResultPreviewSchema).optional(),
    taskTemplates: z.array(z.any()).optional(),
  }),
  actions: z.array(GoalAutomationActionSchema),
  tokenUsage: TokenUsageSchema,
  providerId: brandedId<AiProviderConfigId>(),
  processingTimeMs: z.number(),
  generatedAt: z.number(),
  providerUsed: z.string().optional(),
  modelUsed: z.string().optional(),
});

const GoalWorkflowExecutionSummaryDTOSchema = z.object({
  status: z.enum(['success', 'partial', 'failed']),
  executedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
});

const GoalWorkflowRecoveryDTOSchema = z.object({
  canRetry: z.boolean(),
  failedActions: z.array(GoalAutomationExecutedActionSchema),
  suggestions: z.array(z.string()),
});

export const GoalWorkflowConfirmResultDTOSchema = GoalWorkflowPlanPayloadSchema.extend({
  state: z.literal('confirm'),
});

export const GoalWorkflowExecutionResultDTOSchema = GoalWorkflowPlanPayloadSchema.extend({
  state: z.literal('result'),
  executedActions: z.array(GoalAutomationExecutedActionSchema),
  executionSummary: GoalWorkflowExecutionSummaryDTOSchema,
  recovery: GoalWorkflowRecoveryDTOSchema,
});

export const GoalWorkflowResultDTOSchema = z.discriminatedUnion('state', [
  GoalWorkflowClarificationResultDTOSchema,
  GoalWorkflowDraftResultDTOSchema,
  GoalWorkflowConfirmResultDTOSchema,
  GoalWorkflowExecutionResultDTOSchema,
]);
