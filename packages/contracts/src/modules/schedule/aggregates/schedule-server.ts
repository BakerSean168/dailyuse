/**
 * Schedule Aggregate Server DTO
 * 
 * Represents a user-facing calendar event/meeting with conflict detection capabilities.
 * This is separate from ScheduleTask which handles cron-based background automation.
 * 
 * @module Schedule
 * @since Story 9.1 (EPIC-SCHEDULE-001)
 */

import type { ScheduleId, IdentityId, DomainDate, TransferDate, PersistenceDate } from '@/primitives';

// ============ Domain Shape (领域层) ============

/**
 * Schedule 聚合根 - Domain Shape
 * 给 domain-server 中的 Class 实现用
 */
export interface ScheduleServer {
  readonly id: ScheduleId;
  readonly identityId: IdentityId;
  readonly name: string;
  readonly description: string | null;
  readonly startTime: DomainDate;
  readonly endTime: DomainDate;
  readonly duration: number;
  readonly hasConflict: boolean;
  readonly conflictingSchedules: readonly ScheduleId[] | null;
  readonly priority: number | null;
  readonly location: string | null;
  readonly attendees: readonly string[] | null;
  readonly createdAt: DomainDate;
  readonly updatedAt: DomainDate;
}

// ============ Transfer DTO (传输层) ============

export interface ScheduleServerDTO {
  /**
   * Unique identifier for the schedule
   */
  readonly id: string;

  /**
   * Identity that owns this schedule
   */
  readonly identityId: string;

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
   * Array of IDs of conflicting schedules (if hasConflict is true)
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
   * List of attendee email addresses or user IDs
   * @future Story TBD
   */
  readonly attendees?: readonly string[];

  /**
   * Creation timestamp (Unix timestamp in milliseconds)
   */
  readonly createdAt: TransferDate;

  /**
   * Last update timestamp (Unix timestamp in milliseconds)
   */
  readonly updatedAt: TransferDate;
}

// ============ Persistence DTO (持久层) ============

export interface SchedulePersistenceDTO {
  readonly id: string;
  readonly identityId: string;
  readonly name: string;
  readonly description: string | null;
  readonly startTime: PersistenceDate;
  readonly endTime: PersistenceDate;
  readonly duration: number;
  readonly hasConflict: boolean;
  readonly conflictingSchedules: string | null; // JSON array string
  readonly priority: number | null;
  readonly location: string | null;
  readonly attendees: string | null; // JSON array string
  readonly createdAt: PersistenceDate;
  readonly updatedAt: PersistenceDate;
}
