/**
 * Active Hours Config Value Object
 */

// ============ Interface Definitions ============

/** Active hours config - Server interface. */
export interface IActiveHoursConfigServer {
  enabled: boolean;
  /** Start hour (0-23) */
  startHour: number;
  /** End hour (0-23) */
  endHour: number;

  // Value object methods
  with(
    updates: Partial<
      Omit<
        IActiveHoursConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IActiveHoursConfigServer;

  // DTO conversion methods
}

/** Active hours config - Client interface. */
export interface IActiveHoursConfigClient {
  enabled: boolean;
  startHour: number;
  endHour: number;

  // UI helper properties
  displayText: string; // "09:00 - 21:00" | "All day"

  // Value object methods

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Active Hours Config Server DTO
 */
export interface ActiveHoursConfigServerDTO {
  enabled: boolean;
  startHour: number;
  endHour: number;
}

/**
 * Active Hours Config Client DTO
 */
export interface ActiveHoursConfigClientDTO {
  enabled: boolean;
  startHour: number;
  endHour: number;
  displayText: string;
}

/**
 * Active Hours Config Persistence DTO
 */
export interface ActiveHoursConfigPersistenceDTO {
  enabled: boolean;
  start_hour: number;
  end_hour: number;
}

// ============ Type Exports ============

export type ActiveHoursConfigServer = IActiveHoursConfigServer;
export type ActiveHoursConfigClient = IActiveHoursConfigClient;
