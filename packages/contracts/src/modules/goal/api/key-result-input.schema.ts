import { z } from 'zod';
import { brandedId } from '../../../primitives';
import type { KeyResultId } from '../../../primitives';
import { KeyResultCalculationMethod } from '../value-objects/key-result-calculation-method';

/** Canonical create/update input for KR Measurement V2. */
export const KeyResultInputSchema = z
  .object({
    id: brandedId<KeyResultId>().optional(),
    title: z.string().min(1).max(200),
    description: z.string().max(2000).nullable().optional(),
    calculationMethod: z.enum(KeyResultCalculationMethod).default(KeyResultCalculationMethod.Sum),
    startingValue: z.number().optional(),
    currentValue: z.number().optional(),
    targetValue: z.number(),
    progressBaselineValue: z.number().nullable().optional(),
    unit: z.string().max(20).nullable().optional(),
    weight: z.number().int().min(1).max(5).default(3),
  })
  .strict();

export type KeyResultInput = z.infer<typeof KeyResultInputSchema>;
