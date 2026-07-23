/**
 * Active Time Config Value Object
 *
 * Refactoring notes:
 * - Removed endDate field (lifecycle control handled by status field)
 * - Renamed startDate to activatedAt (clearer semantics)
 * - activatedAt serves as the calculation base for recurring reminders
 *
 * Residual 833: ActiveTimeConfigDTO dual retired — sole ActiveTimeConfigSchema + z.infer
 * (response schema no longer uses shadow startDate/endDate transport dual).
 */

import { z } from 'zod';

// Residual 833: ActiveTimeConfigDTO dual retired — OpenAPI + transport use ActiveTimeConfigSchema.
export const ActiveTimeConfigSchema = z.object({
  /** Activation timestamp (epoch ms) - last enablement / recurrence base */
  activatedAt: z.number(),
});

export type ActiveTimeConfigDTO = z.infer<typeof ActiveTimeConfigSchema>;

// ============ Interface Definitions ============

/** Active time config interface. */
export interface IActiveTimeConfig {
  /** Activation time (epoch ms) - timestamp of last enablement */
  activatedAt: number;

  // Value object methods
  with(
    updates: Partial<
      Omit<IActiveTimeConfig, 'equals' | 'with' | 'toDTO'>
    >,
  ): IActiveTimeConfig;

  // DTO conversion methods
}
