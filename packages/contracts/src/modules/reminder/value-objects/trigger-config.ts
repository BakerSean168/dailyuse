/**
 * Trigger Config Value Object
 */

import { z } from 'zod';
import { TriggerType } from './trigger-type';

// Residual 735: trigger config dual bodies retired — OpenAPI + transport use
// TriggerConfigSchema (semantic types are z.infer aliases).

export const FixedTimeTriggerSchema = z.object({
  time: z.string(),
  timezone: z.string().nullable(),
});

export const IntervalTriggerSchema = z.object({
  minutes: z.number(),
  startTime: z.number().nullable(),
});

export const TriggerConfigSchema = z.object({
  type: z.enum(TriggerType),
  fixedTime: FixedTimeTriggerSchema.nullable(),
  interval: IntervalTriggerSchema.nullable(),
});

export type FixedTimeTrigger = z.infer<typeof FixedTimeTriggerSchema>;
export type IntervalTrigger = z.infer<typeof IntervalTriggerSchema>;
export type TriggerConfigDTO = z.infer<typeof TriggerConfigSchema>;

// ============ Interface Definitions ============

/** Trigger config interface. */
export interface ITriggerConfig {
  type: TriggerType;
  fixedTime: FixedTimeTrigger | null;
  interval: IntervalTrigger | null;

  // Value object methods
  with(
    updates: Partial<
      Omit<ITriggerConfig, 'equals' | 'with' | 'toDTO'>
    >,
  ): ITriggerConfig;

  // DTO conversion methods
}
