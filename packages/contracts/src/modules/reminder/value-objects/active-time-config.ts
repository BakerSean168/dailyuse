/**
 * Active Time Config Value Object
 *
 * Refactoring notes:
 * - Removed endDate field (lifecycle control handled by status field)
 * - Renamed startDate to activatedAt (clearer semantics)
 * - activatedAt serves as the calculation base for recurring reminders
 */

// ============ Interface Definitions ============

/** Active time config - Server interface. */
export interface IActiveTimeConfigServer {
  /** Activation time (epoch ms) - timestamp of last enablement */
  activatedAt: number;

  // Value object methods
  with(
    updates: Partial<
      Omit<
        IActiveTimeConfigServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IActiveTimeConfigServer;

  // DTO conversion methods
}

/** Active time config - Client interface. */
export interface IActiveTimeConfigClient {
  /** Activation time (epoch ms) */
  activatedAt: number;

  // UI helper properties
  displayText: string; // "Activated: 2024-01-01 10:30"

  // Value object methods

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Active Time Config Server DTO
 */
export interface ActiveTimeConfigServerDTO {
  /** Activation timestamp */
  activatedAt: number;
}

/**
 * Active Time Config Client DTO
 */
export interface ActiveTimeConfigClientDTO {
  /** Activation timestamp */
  activatedAt: number;
  /** Display text */
  displayText: string;
}

/**
 * Active Time Config Persistence DTO
 */
export interface ActiveTimeConfigPersistenceDTO {
  /** Activation timestamp */
  activatedAt: number;
}

// ============ Type Exports ============

export type ActiveTimeConfigServer = IActiveTimeConfigServer;
export type ActiveTimeConfigClient = IActiveTimeConfigClient;
