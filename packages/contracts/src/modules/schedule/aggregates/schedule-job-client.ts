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

// ============ 实体接口 ============

/**
 * Schedule Job 聚合根 - Client 接口
 */
export interface ScheduleJobClient {
  id: ScheduleId;
  identityId: IdentityId;
  nextRunAt: DomainDate;
  cronExpression: string | null;
  sourceModule: string;
  sourceId: string;
  triggerEvent: string;
  payload: Record<string, any> | null;

  // UI 辅助属性
  nextRunAtFormatted: string;
  cronExpressionDisplay: string;
  sourceDisplay: string;
  payloadDisplay: string;
}

// ============ DTO 定义 ============

export interface ScheduleJobClientDTO {
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


