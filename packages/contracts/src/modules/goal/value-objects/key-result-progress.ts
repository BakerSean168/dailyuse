import { z } from 'zod';
import { KeyResultCalculationMethod } from './key-result-calculation-method';

/** Canonical KR Measurement V2 shape. */
export interface KeyResultProgress {
  startingValue: number;
  currentValue: number;
  targetValue: number;
  progressBaselineValue: number | null;
  aggregationMethod: KeyResultCalculationMethod;
  unit: string | null;
}

export const KeyResultProgressDTOSchema = z.object({
  startingValue: z.number(),
  currentValue: z.number(),
  targetValue: z.number(),
  progressBaselineValue: z.number().nullable(),
  aggregationMethod: z.enum(KeyResultCalculationMethod),
  unit: z.string().max(20).nullable(),
});

export type KeyResultProgressDTO = z.infer<typeof KeyResultProgressDTOSchema>;
