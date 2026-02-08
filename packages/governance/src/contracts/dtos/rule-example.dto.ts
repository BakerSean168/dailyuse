import { z } from 'zod';
import type { RuleExampleType } from '../domain/rule.enums';

export const RuleExampleInputSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).optional(),
  language: z.string().min(1).max(50).optional(),
  code: z.string().min(1, 'Example code is required'),
});

export const RuleExamplesInputSchema = z.object({
  good: z.array(RuleExampleInputSchema).min(1, 'At least one good example is required'),
  bad: z.array(RuleExampleInputSchema).min(1, 'At least one bad example is required'),
});

export type RuleExampleInput = z.infer<typeof RuleExampleInputSchema>;
export type RuleExamplesInput = z.infer<typeof RuleExamplesInputSchema>;

export interface RuleExampleDTO extends RuleExampleInput {
  type: RuleExampleType;
}
