import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId } from '../../../primitives';
import { ImportanceLevel } from '../../../shared/value-objects/importance';
import { GoalCategory } from '../dtos/goal-generation-result.dto';
import { KeyResultValueType } from '../../goal/value-objects/key-result-value-type';
import { KeyResultCalculationMethod } from '../../goal/value-objects/key-result-calculation-method';

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

export const GoalAutomationTaskTemplatePreviewSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  importance: z.nativeEnum(ImportanceLevel),
  cadence: z.enum(['daily', 'weekly', 'once']),
});

// Residual 705: preview dual body retired — schema owns the shape.
export type GoalAutomationTaskTemplatePreview = z.infer<
  typeof GoalAutomationTaskTemplatePreviewSchema
>;

export const GoalAutomationReminderPreviewSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  importance: z.nativeEnum(ImportanceLevel),
  cadence: z.enum(['daily', 'weekly', 'once']),
  timeOfDay: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
});

// Residual 705: preview dual body retired — schema owns the shape.
export type GoalAutomationReminderPreview = z.infer<
  typeof GoalAutomationReminderPreviewSchema
>;

export const GoalAutomationPlanSchema = z.object({
  goal: GeneratedGoalDraftSchema,
  keyResults: z.array(KeyResultPreviewSchema).optional(),
  taskTemplates: z.array(GoalAutomationTaskTemplatePreviewSchema).optional(),
  reminders: z.array(GoalAutomationReminderPreviewSchema).optional(),
});

// Residual 705: plan dual body retired — OpenAPI + transport use GoalAutomationPlanSchema.
export type GoalAutomationPlanDTO = z.infer<typeof GoalAutomationPlanSchema>;

export const GenerateGoalAutomationSchema = z.object({
  idea: z.string().trim().min(10, '描述至少需要 10 个字符'),
  category: z.string().trim().optional(),
  timeframe: z.string().trim().optional(),
  includeKeyResults: z.boolean().default(true).optional(),
  includeTaskTemplates: z.boolean().default(true).optional(),
  confirm: z.boolean().default(false).optional(),
  approvedSummary: z.string().trim().min(1).optional(),
  approvedPlan: GoalAutomationPlanSchema.optional(),
  approvedActions: z.array(z.lazy(() => GoalAutomationActionSchema)).optional(),
  providerId: brandedId<AiProviderConfigId>().optional(),
});

export type GenerateGoalAutomationReq = z.infer<typeof GenerateGoalAutomationSchema>;

export const GoalAutomationActionToolSchema = z.enum([
  'create_goal',
  'create_key_result',
  'create_task_template',
  'create_reminder',
  'search_notes',
  'fetch_stats',
]);

export type GoalAutomationActionTool = z.infer<typeof GoalAutomationActionToolSchema>;

export const GoalAutomationActionSchema = z.object({
  tool: GoalAutomationActionToolSchema,
  index: z.number().int().nonnegative().optional(),
  rationale: z.string().trim().min(1).optional(),
});

export type GoalAutomationAction = z.infer<typeof GoalAutomationActionSchema>;

export const GoalAutomationExecutedActionSchema = z.object({
  tool: GoalAutomationActionToolSchema,
  status: z.enum(['executed', 'skipped', 'failed']),
  entityId: z.string().optional(),
  message: z.string(),
});

export type GoalAutomationExecutedAction = z.infer<typeof GoalAutomationExecutedActionSchema>;


export interface GenerateGoalAutomationRes {
  summary: string;
  requiresConfirmation: boolean;
  plan: GoalAutomationPlanDTO;
  actions: GoalAutomationAction[];
  executedActions?: GoalAutomationExecutedAction[];
  providerId: AiProviderConfigId;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  processingTimeMs: number;
}
