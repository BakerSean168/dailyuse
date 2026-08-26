/**
 * Task -> Goal semantic link and optional automatic contribution rule.
 * ADR-056: business context linking is independent from progress settlement.
 */

import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { GoalId, KeyResultId } from '../../../primitives';
import { TaskGoalBindingTrigger } from './task-goal-binding-trigger';

export const GoalContributionRuleSchema = z.object({
  value: z.number().positive(),
  trigger: z.enum(TaskGoalBindingTrigger),
});
export type GoalContributionRule = z.infer<typeof GoalContributionRuleSchema>;

export const TaskGoalLinkSchema = z.object({
  goalId: brandedId<GoalId>(),
  keyResultId: brandedId<KeyResultId>(),
  contribution: GoalContributionRuleSchema.nullable().optional().default(null),
});
export type TaskGoalLinkDTO = z.infer<typeof TaskGoalLinkSchema>;
export type TaskGoalLink = TaskGoalLinkDTO;

/**
 * Transitional symbol aliases while call sites move from the historical
 * "binding" noun. The serialized shape is already the canonical ADR-056 link.
 */
export const TaskGoalBindingSchema = TaskGoalLinkSchema;
export type TaskGoalBindingDTO = z.infer<typeof TaskGoalBindingSchema>;
export type TaskGoalBinding = TaskGoalBindingDTO;
