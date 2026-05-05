/**
 * Active Hours Config Value Object
 */

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

/**
 * Active Hours Config DTO
 */
export interface ActiveHoursConfigDTO {
  enabled: boolean;
  startHour: number;
  endHour: number;
}
