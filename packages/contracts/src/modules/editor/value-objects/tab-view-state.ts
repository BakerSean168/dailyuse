/**
 * Tab View State Value Object
 */

// ============ Interface Definitions ============

/** Tab View State interface. */
export interface ITabViewState {
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
      Omit<ITabViewState, 'equals' | 'with' | 'toDTO'>
    >,
  ): ITabViewState;

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Tab View State DTO
 */
export interface TabViewStateDTO {
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
