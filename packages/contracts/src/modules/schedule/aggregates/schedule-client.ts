/**
 * Schedule Aggregate Client DTO
 * 
 * Client-side representation of a user-facing calendar event/meeting.
 * This is the DTO sent to web/desktop clients.
 * 
 * @module Schedule
 * @since Story 9.1 (EPIC-SCHEDULE-001)
 */

import type { ScheduleId, IdentityId, DomainDate, TransferDate } from '@/primitives';
import type { ScheduleServerDTO, ScheduleServer } from './schedule-server';

// ============ DTO 定义 ============

export interface ScheduleClientDTO {
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
  readonly description: string | null;

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
   */
  readonly hasConflict: boolean;

  /**
   * Array of IDs of conflicting schedules (if hasConflict is true)
   */
  readonly conflictingSchedules: readonly string[] | null;

  /**
   * Priority level (1-5, where 5 is highest)
   */
  readonly priority: number | null;

  /**
   * Location (e.g., "Conference Room A", "Zoom Link")
   */
  readonly location: string | null;

  /**
   * List of attendee email addresses or user IDs
   */
  readonly attendees: readonly string[] | null;

  /**
   * Creation timestamp
   */
  readonly createdAt: TransferDate;

  /**
   * Last update timestamp
   */
  readonly updatedAt: TransferDate;
}

// ============ 实体接口 ============

/**
 * Schedule 聚合�?- Client 接口
 */
export interface ScheduleClient {
  // 基础属�?
  id: ScheduleId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  startTime: DomainDate;
  endTime: DomainDate;
  duration: number;
  hasConflict: boolean;
  conflictingSchedules: readonly ScheduleId[] | null;
  priority: number | null;
  location: string | null;
  attendees: readonly string[] | null;
  createdAt: DomainDate;
  updatedAt: DomainDate;

  // UI 辅助属�?
  durationDisplay: string;
  startTimeFormatted: string;
  endTimeFormatted: string;
  timeRangeDisplay: string;
  priorityDisplay: string;
  priorityColor: string;
  conflictDisplay: string;
  conflictColor: string;
  attendeeCount: number;
  attendeesDisplay: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}
