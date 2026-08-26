import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { KeyResultId } from '../../../primitives';

export const GoalReviewTrendPointSchema = z.object({
  at: z.number().int(),
  progressPercentage: z.number().min(0).max(100),
});
export type GoalReviewTrendPoint = z.infer<typeof GoalReviewTrendPointSchema>;

export const GoalReviewKeyResultContextSchema = z.object({
  keyResultId: brandedId<KeyResultId>(),
  title: z.string(),
  unit: z.string().nullable(),
  startPercentage: z.number().min(0).max(100),
  endPercentage: z.number().min(0).max(100),
  deltaPercentage: z.number(),
  trend: z.array(GoalReviewTrendPointSchema),
});
export type GoalReviewKeyResultContext = z.infer<typeof GoalReviewKeyResultContextSchema>;

export const GoalReviewSystemContextSchema = z.object({
  windowStartAt: z.number().int(),
  windowEndAt: z.number().int(),
  overallProgress: z.object({
    startPercentage: z.number().min(0).max(100),
    endPercentage: z.number().min(0).max(100),
    deltaPercentage: z.number(),
  }),
  keyResults: z.array(GoalReviewKeyResultContextSchema),
  summary: z.object({
    recordCount: z.number().int().min(0),
    manualRecordCount: z.number().int().min(0),
    taskContributionCount: z.number().int().min(0),
  }),
});
export type GoalReviewSystemContext = z.infer<typeof GoalReviewSystemContextSchema>;
