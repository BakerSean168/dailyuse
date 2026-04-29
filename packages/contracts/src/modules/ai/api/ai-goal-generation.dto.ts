import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { AiProviderConfigId } from '../../../primitives';
import {
  GoalAutomationActionSchema,
  GenerateGoalAutomationSchema,
} from './ai-goal-automation.dto';
import type { GoalWorkflowResultDTO } from '../dtos/goal-workflow-result.dto';

const GoalWorkflowCommandSchema = z.enum(['draft', 'prepare', 'execute']);

const GoalWorkflowDraftContextSchema = z.object({
  goal: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    category: z.string().trim().optional(),
    importance: z.string().trim().min(1),
    motivation: z.string().trim().optional(),
    feasibilityAnalysis: z.string().trim().optional(),
    tags: z.array(z.string().trim()).optional(),
    suggestedStartDate: z.number().optional(),
    suggestedEndDate: z.number().optional(),
  }),
  keyResults: z
    .array(
      z.object({
        title: z.string().trim().min(1),
        description: z.string().trim().optional(),
        valueType: z.string().trim().min(1),
        calculationMethod: z.string().trim().min(1),
        startValue: z.number(),
        currentValue: z.number(),
        targetValue: z.number(),
        unit: z.string().trim().min(1),
        weight: z.number().int().min(1).max(5),
      }),
    )
    .optional(),
});

export const GenerateGoalsSchema = z.object({
  idea: z.string().trim().min(10, '描述至少需要 10 个字符'),
  category: z.string().trim().optional(),
  timeframe: z.string().trim().optional(),
  includeKeyResults: z.boolean().default(true).optional(),
  includeTaskTemplates: GenerateGoalAutomationSchema.shape.includeTaskTemplates.optional(),
  providerId: brandedId<AiProviderConfigId>().optional(),
  model: z.string().trim().min(1).max(120).optional(),
  command: GoalWorkflowCommandSchema.default('draft').optional(),
  clarificationAnswers: z.array(z.string().trim().min(1)).min(1).max(4).optional(),
  draftContext: GoalWorkflowDraftContextSchema.optional(),
  approvedSummary: z.string().trim().min(1).optional(),
  approvedPlan: GenerateGoalAutomationSchema.shape.approvedPlan.optional(),
  approvedActions: z.array(GoalAutomationActionSchema).optional(),
});

export type GenerateGoalsReq = z.infer<typeof GenerateGoalsSchema>;
export type GenerateGoalsRes = GoalWorkflowResultDTO;
