/**
 * Tab View State Value Object
 */

// ============ Interface Definitions ============

/** Tab View State - Server interface. */
export interface ITabViewStateServer {
  scrollTop: number;
  scrollLeft: number;
  cursorPosition: {
    line: number;
    column: number;
  };
  selections?: Array<{
    start: { line: number; column: number };
    end: { line: number; column: number };
  }> | null;

  // Value object methods
  with(
    updates: Partial<
      Omit<
        ITabViewStateServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): ITabViewStateServer;

  // DTO conversion methods
}

/** Tab View State - Client interface. */
export interface ITabViewStateClient {
  scrollTop: number;
  scrollLeft: number;
  cursorPosition: {
    line: number;
    column: number;
  };
  selections?: Array<{
    start: { line: number; column: number };
    end: { line: number; column: number };
  }> | null;

  // Value object methods

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Tab View State Server DTO
 */
export interface TabViewStateServerDTO {
  scrollTop: number;
  scrollLeft: number;
  cursorPosition: {
    line: number;
    column: number;
  };
  selections?: Array<{
    start: { line: number; column: number };
    end: { line: number; column: number };
  }> | null;
}

/**
 * Tab View State Client DTO
 */
export interface TabViewStateClientDTO {
  scrollTop: number;
  scrollLeft: number;
  cursorPosition: {
    line: number;
    column: number;
  };
  selections?: Array<{
    start: { line: number; column: number };
    end: { line: number; column: number };
  }> | null;
}

/**
 * Tab View State Persistence DTO
 */
export interface TabViewStatePersistenceDTO {
  scroll_top: number;
  scroll_left: number;
  cursor_position: string; // JSON string
  selections: string | null; // JSON string
}

// ============ Type Exports ============

export type TabViewStateServer = ITabViewStateServer;
export type TabViewStateClient = ITabViewStateClient;
