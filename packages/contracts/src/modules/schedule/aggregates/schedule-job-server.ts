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
export interface ScheduleJobServer {
  id: ScheduleId;
  identityId: IdentityId;

  nextRunAt: DomainDate;
  cronExpression: string | null;

  sourceModule: string;
  sourceId: string;

  triggerEvent: string;
  payload: Record<string, any> | null;
}

// ============ Transfer DTO (传输层) ============

export interface ScheduleJobServerDTO {
  /**
   * Unique identifier for the schedule
   */
  id: string;

  /**
   * Identity that owns this schedule
   */
  identityId: string;

  /**
   * Next run time for this scheduled job
   */
  nextRunAt: TransferDate;

  /**
   * Cron expression defining the schedule pattern
   * @example "0 9 * * MON-FRI" for 9 AM weekdays
   */
  cronExpression: string | null;

  /**
   * Source module that contains the implementation
   * @example "notification", "report", "cleanup"
   */
  sourceModule: string;

  /**
   * Identifier of the resource within the source module
   */
  sourceId: string;

  /**
   * Event that triggers this job execution
   */
  triggerEvent: string;

  /**
   * Additional payload data for job execution
   */
  payload: Record<string, any> | null;
}

// ============ Persistence DTO (持久层) ============

export interface SchedulePersistenceDTO {
  id: string;
  identityId: string;
  nextRunAt: PersistenceDate;
  cronExpression: string | null;
  sourceModule: string;
  sourceId: string;
  triggerEvent: string;
  payload: string | null; // JSON string
}
