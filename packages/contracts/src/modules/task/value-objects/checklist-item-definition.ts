/**
 * ChecklistItemDefinition Value Object
 *
 * Task plan checklist items are definitions only; completion state belongs to
 * concrete Task occurrences.
 */
import { z } from 'zod';

/** Residual 853: keep one canonical VO interface; DTO remains its exact type alias. */
export interface ChecklistItemDefinition {
  title: string;
  order: number;
}

export type ChecklistItemDefinitionDTO = ChecklistItemDefinition;

/** Public transport validation for the canonical checklist definition. */
export const ChecklistItemDefinitionSchema: z.ZodType<ChecklistItemDefinition> = z.object({
  title: z.string().trim().min(1).max(200),
  order: z.number().int().nonnegative(),
});
