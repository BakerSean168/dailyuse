/**
 * Schedule Aggregate Server DTO
 * 
 * Represents a user-facing calendar event/meeting with conflict detection capabilities.
 * This is separate from ScheduleTask which handles cron-based background automation.
 * 
 * @module Schedule
 * @since Story 9.1 (EPIC-SCHEDULE-001)
 */

export interface ScheduleServerDTO {
  /**
   * Unique identifier for the schedule
   */
  readonly uuid: string;

  /**
   * Account that owns this schedule
   */
  readonly accountUuid: string;

  /**
   * Schedule name/summary (e.g., "Team Meeting", "Dentist Appointment")
   */
  readonly name: string;

  /**
   * Optional detailed description
   */
  readonly description?: string;

  /**
   * Start time (Unix timestamp in milliseconds)
   */
  readonly startTime: number;

  /**
   * End time (Unix timestamp in milliseconds)
   */
  readonly endTime: number;

  /**
   * Duration in minutes (calculated: (endTime - startTime) / 60000)
   */
  readonly duration: number;

  /**
   * Whether this schedule has conflicts with other schedules
   * @since Story 9.1 - Conflict Detection
   */
  readonly hasConflict: boolean;

  /**
   * Array of UUIDs of conflicting schedules (if hasConflict is true)
   * @since Story 9.1 - Conflict Detection
   */
  readonly conflictingSchedules?: readonly string[];

  /**
   * Priority level (1-5, where 5 is highest)
   * @future Story TBD
   */
  readonly priority?: number;

  /**
   * Location (e.g., "Conference Room A", "Zoom Link")
   * @future Story TBD
   */
  readonly location?: string;

  /**
   * List of attendee email addresses or user UUIDs
   * @future Story TBD
   */
  readonly attendees?: readonly string[];

  /**
   * Creation timestamp (Unix timestamp in milliseconds)
   */
  readonly createdAt: number;

  /**
   * Last update timestamp (Unix timestamp in milliseconds)
   */
  readonly updatedAt: number;
}
