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

/** Session Layout interface. */
export interface ISessionLayout {
  splitType: SessionSplitType;
  groupCount: number;
  activeGroupIndex: number;

  // Value object methods
  with(
    updates: Partial<
      Omit<ISessionLayout, 'equals' | 'with' | 'toDTO'>
    >,
  ): ISessionLayout;

  // DTO conversion methods
}

// ============ DTO Definitions ============

/**
 * Session Layout DTO
 */
export interface SessionLayoutDTO {
  splitType: SessionSplitType;
  groupCount: number;
  activeGroupIndex: number;
}

// ============ Defaults ============

export const DEFAULT_SESSION_LAYOUT: SessionLayoutDTO = {
  splitType: 'Horizontal',
  groupCount: 1,
  activeGroupIndex: 0,
};
