/**
 * Conflict Detection Result Types
 *
 * Defines the structure for conflict detection results, including
 * conflict details and resolution suggestions.
 *
 * @module Schedule
 * @since Story 9.1 (EPIC-SCHEDULE-001)
 */

import type { ScheduleId } from '../../../primitives';

/**
 * Result of conflict detection analysis
 */
export const ConflictSeverity = {
  Minor: 'Minor',
  Moderate: 'Moderate',
  Severe: 'Severe',
} as const;

export type ConflictSeverity = (typeof ConflictSeverity)[keyof typeof ConflictSeverity];

export const ConflictSuggestionType = {
  MoveEarlier: 'MoveEarlier',
  MoveLater: 'MoveLater',
  Shorten: 'Shorten',
} as const;

export type ConflictSuggestionType =
  (typeof ConflictSuggestionType)[keyof typeof ConflictSuggestionType];

export interface ConflictDetectionResult {
  /**
   * Whether any conflicts were detected
   */
  readonly hasConflict: boolean;

  /**
   * Array of detected conflicts with details
   */
  readonly conflicts: readonly ConflictDetail[];

  /**
   * Array of suggested resolutions to avoid conflicts
   */
  readonly suggestions: readonly ConflictSuggestion[];
}

/**
 * Details of a single conflict between two schedules
 */
export interface ConflictDetail {
  /**
   * UUID of the conflicting schedule
   */
  readonly scheduleId: ScheduleId;

  /**
   * Title of the conflicting schedule
   */
  readonly scheduleTitle: string;

  /**
   * Start time of the overlap period (Unix timestamp in milliseconds)
   */
  readonly overlapStart: number;

  /**
   * End time of the overlap period (Unix timestamp in milliseconds)
   */
  readonly overlapEnd: number;

  /**
   * Duration of the overlap in minutes
   */
  readonly overlapDuration: number;

  /**
   * Severity of the conflict based on overlap duration
   * @future Story TBD - Will integrate with ConflictSeverity enum
   */
  readonly severity?: ConflictSeverity;
}

/**
 * Suggested resolution to avoid schedule conflicts
 */
export interface ConflictSuggestion {
  /**
   * Type of suggested resolution
   * - move_earlier: Move schedule to before conflicting schedules
   * - move_later: Move schedule to after conflicting schedules
   * - shorten: Reduce duration to fit in available gaps
   */
  readonly type: ConflictSuggestionType;

  /**
   * Suggested new start time (Unix timestamp in milliseconds)
   */
  readonly newStartTime: number;

  /**
   * Suggested new end time (Unix timestamp in milliseconds)
   */
  readonly newEndTime: number;

  /**
   * Human-readable description of the suggestion
   * @example "Move to 2:00 PM - 3:00 PM"
   */
  readonly description?: string;
}
