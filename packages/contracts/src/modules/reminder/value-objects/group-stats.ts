/**
 * Group Stats Value Object
 */

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

/**
 * Group Stats DTO
 */
export interface GroupStatsDTO {
  totalTemplates: number;
  activeTemplates: number;
  pausedTemplates: number;
  selfEnabledTemplates: number;
  selfPausedTemplates: number;
}
