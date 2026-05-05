/**
 * Active Time Config Value Object
 *
 * Refactoring notes:
 * - Removed endDate field (lifecycle control handled by status field)
 * - Renamed startDate to activatedAt (clearer semantics)
 * - activatedAt serves as the calculation base for recurring reminders
 */

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

// ============ DTO Definitions ============

/**
 * Active Time Config DTO
 */
export interface ActiveTimeConfigDTO {
  /** Activation timestamp */
  activatedAt: number;
}
