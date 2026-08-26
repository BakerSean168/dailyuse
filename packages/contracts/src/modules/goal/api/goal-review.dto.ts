/** Goal Review V2 request/query contracts. */
import { z } from 'zod';
import { GoalIdParamsSchema } from './goal-crud.dto';
import { GoalReviewListResSchema } from './response-schemas';

export const GoalReviewWindowQuerySchema = z.object({
  windowDays: z.coerce.number().int().min(1).max(365).default(7).optional(),
});
export type GoalReviewWindowQuery = z.infer<typeof GoalReviewWindowQuerySchema>;

export const CreateGoalReviewSchema = z.object({
  expectedVersion: z.number().int().min(1),
  reflection: z.string().min(1, 'Reflection is required').max(10000),
  challenges: z.string().max(4000).nullable().optional(),
  adjustments: z.string().max(4000).nullable().optional(),
  windowDays: z.number().int().min(1).max(365).default(7).optional(),
});
export type CreateGoalReviewReq = z.infer<typeof CreateGoalReviewSchema>;

export const UpdateGoalReviewSchema = z
  .object({
    expectedVersion: z.number().int().min(1),
    reflection: z.string().min(1).max(10000).optional(),
    challenges: z.string().max(4000).nullable().optional(),
    adjustments: z.string().max(4000).nullable().optional(),
  })
  .refine(
    (input) =>
      input.reflection !== undefined ||
      input.challenges !== undefined ||
      input.adjustments !== undefined,
    { message: 'At least one reflection field is required' },
  );
export type UpdateGoalReviewReq = z.infer<typeof UpdateGoalReviewSchema>;

export type GetGoalReviewReq = void;

export const DeleteGoalReviewSchema = z.object({
  expectedVersion: z.number().int().min(1),
});
export type DeleteGoalReviewReq = z.infer<typeof DeleteGoalReviewSchema>;

export type GetGoalReviewsReq = z.infer<typeof GoalIdParamsSchema>;
export type GetGoalReviewsRes = z.infer<typeof GoalReviewListResSchema>;
