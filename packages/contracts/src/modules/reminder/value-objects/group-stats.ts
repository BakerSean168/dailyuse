/**
 * Group Stats Value Object
 */

import { z } from 'zod';

// ============ Interface Definitions ============

/** Group stats interface. */
export interface IGroupStats {
  /** Total template count */
  totalTemplates: number;
  /** Actually active template count */
  activeTemplates: number;
  /** Actually paused template count */
  pausedTemplates: number;
  /** Templates with selfEnabled = true */
  selfEnabledTemplates: number;
  /** Templates with selfEnabled = false */
  selfPausedTemplates: number;

  // Value object methods
  with(
    updates: Partial<
      Omit<IGroupStats, 'equals' | 'with' | 'toDTO'>
    >,
  ): IGroupStats;

  // DTO conversion methods
}

// ============ DTO Definitions ============

// Residual 733: group stats dual body retired — OpenAPI + transport use
// GroupStatsSchema (semantic GroupStatsDTO is a z.infer alias).
export const GroupStatsSchema = z.object({
  totalTemplates: z.number(),
  activeTemplates: z.number(),
  pausedTemplates: z.number(),
  selfEnabledTemplates: z.number(),
  selfPausedTemplates: z.number(),
});

export type GroupStatsDTO = z.infer<typeof GroupStatsSchema>;
