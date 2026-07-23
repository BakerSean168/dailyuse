/**
 * Active Hours Config Value Object
 */

import { z } from 'zod';

// ============ Interface Definitions ============

/** Active hours config interface. */
export interface IActiveHoursConfig {
  enabled: boolean;
  /** Start hour (0-23) */
  startHour: number;
  /** End hour (0-23) */
  endHour: number;

  // Value object methods
  with(
    updates: Partial<
      Omit<IActiveHoursConfig, 'equals' | 'with' | 'toDTO'>
    >,
  ): IActiveHoursConfig;

  // DTO conversion methods
}

// ============ DTO Definitions ============

// Residual 733: active hours dual body retired — OpenAPI + transport use
// ActiveHoursConfigSchema (semantic ActiveHoursConfigDTO is a z.infer alias).
export const ActiveHoursConfigSchema = z.object({
  enabled: z.boolean(),
  startHour: z.number(),
  endHour: z.number(),
});

export type ActiveHoursConfigDTO = z.infer<typeof ActiveHoursConfigSchema>;
