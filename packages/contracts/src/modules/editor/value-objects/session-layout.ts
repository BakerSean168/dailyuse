/**
 * Session Layout Value Object
 */

// ============ Interface Definitions ============
export const SessionSplitType = {
  Horizontal: 'Horizontal',
  Vertical: 'Vertical',
  Grid: 'Grid',
} as const;

export type SessionSplitType = (typeof SessionSplitType)[keyof typeof SessionSplitType];

/** Session Layout - Server interface. */
export interface ISessionLayoutServer {
  splitType: SessionSplitType;
  groupCount: number;
  activeGroupIndex: number;

  // Value object methods
  with(
    updates: Partial<
      Omit<
        ISessionLayoutServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): ISessionLayoutServer;

  // DTO conversion methods
}

/** Session Layout - Client interface. */
export interface ISessionLayoutClient {
  splitType: SessionSplitType;
  groupCount: number;
  activeGroupIndex: number;

  // Value object methods

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Session Layout Server DTO
 */
export interface SessionLayoutServerDTO {
  splitType: SessionSplitType;
  groupCount: number;
  activeGroupIndex: number;
}

/**
 * Session Layout Client DTO
 */
export interface SessionLayoutClientDTO {
  splitType: SessionSplitType;
  groupCount: number;
  activeGroupIndex: number;
}

/**
 * Session Layout Persistence DTO
 */
export interface SessionLayoutPersistenceDTO {
  split_type: SessionSplitType;
  group_count: number;
  active_group_index: number;
}

// ============ Type Exports ============

export type SessionLayoutServer = ISessionLayoutServer;
export type SessionLayoutClient = ISessionLayoutClient;

// ============ Defaults ============

export const DEFAULT_SESSION_LAYOUT: SessionLayoutServerDTO = {
  splitType: 'Horizontal',
  groupCount: 1,
  activeGroupIndex: 0,
};
