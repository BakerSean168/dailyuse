import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId } from '../../../primitives';
import {
  GoalAutomationActionSchema,
  GoalAutomationExecutedActionSchema,
  GoalAutomationPlanSchema,
} from '../api/ai-goal-automation.dto';
import { GenerateGoalResultDTOSchema } from './goal-generation-result.dto';
import { TokenUsageSchema } from '../value-objects/token-usage';

// Residual 729: goal workflow dual bodies retired — OpenAPI + transport use *Schema only
// (semantic types are z.infer aliases owned by this module).

export const GoalClarificationQuestionSchema = z.object({
  question: z.string(),
  context: z.string().nullable().optional(),
});

export const GoalClarificationSchema = z.object({
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
  plan: GoalAutomationPlanSchema,
  actions: z.array(GoalAutomationActionSchema),
  tokenUsage: TokenUsageSchema,
  providerId: brandedId<AiProviderConfigId>(),
  processingTimeMs: z.number(),
  generatedAt: z.number(),
  providerUsed: z.string().optional(),
  modelUsed: z.string().optional(),
});

export const GoalWorkflowExecutionSummaryDTOSchema = z.object({
  status: z.enum(['success', 'partial', 'failed']),
  executedCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
});

export const GoalWorkflowRecoveryDTOSchema = z.object({
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

export type GoalClarificationQuestionDTO = z.infer<typeof GoalClarificationQuestionSchema>;
export type GoalClarificationDTO = z.infer<typeof GoalClarificationSchema>;
export type GoalWorkflowClarificationResultDTO = z.infer<
  typeof GoalWorkflowClarificationResultDTOSchema
>;
export type GoalWorkflowDraftResultDTO = z.infer<typeof GoalWorkflowDraftResultDTOSchema>;
export type GoalWorkflowConfirmResultDTO = z.infer<typeof GoalWorkflowConfirmResultDTOSchema>;
export type GoalWorkflowExecutionSummaryDTO = z.infer<
  typeof GoalWorkflowExecutionSummaryDTOSchema
>;
export type GoalWorkflowRecoveryDTO = z.infer<typeof GoalWorkflowRecoveryDTOSchema>;
export type GoalWorkflowExecutionResultDTO = z.infer<
  typeof GoalWorkflowExecutionResultDTOSchema
>;
export type GoalWorkflowResultDTO = z.infer<typeof GoalWorkflowResultDTOSchema>;
