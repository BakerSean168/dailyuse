/**
 * Schedule Aggregate Client DTO
 * 
 * Client-side representation of a user-facing calendar event/meeting.
 * This is the DTO sent to web/desktop clients.
 * 
 * @module Schedule
 * @since Story 9.1 (EPIC-SCHEDULE-001)
 */

import type { ScheduleServerDTO } from './ScheduleServer';

// ============ DTO 定义 ============

export interface ScheduleClientDTO {
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
  readonly description?: string | null;

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
   * Array of UUIDs of conflicting schedules (if hasConflict is true)
   */
  readonly conflictingSchedules?: readonly string[] | null;

  /**
   * Priority level (1-5, where 5 is highest)
   */
  readonly priority?: number | null;

  /**
   * Location (e.g., "Conference Room A", "Zoom Link")
   */
  readonly location?: string | null;

  /**
   * List of attendee email addresses or user UUIDs
   */
  readonly attendees?: readonly string[] | null;

  /**
   * Creation timestamp (Unix timestamp in milliseconds)
   */
  readonly createdAt: number;

  /**
   * Last update timestamp (Unix timestamp in milliseconds)
   */
  readonly updatedAt: number;
}

// ============ 实体接口 ============

/**
 * Schedule 聚合根 - Client 接口
 */
export interface ScheduleClient {
  // 基础属性
  uuid: string;
  accountUuid: string;
  name: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  duration: number;
  hasConflict: boolean;
  conflictingSchedules: readonly string[] | null;
  priority: number | null;
  location: string | null;
  attendees: readonly string[] | null;
  createdAt: Date;
  updatedAt: Date;

  // UI 辅助属性
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

  // ===== 业务方法 =====

  // 状态检查
  isOngoing(): boolean;
  isPast(): boolean;
  isUpcoming(withinMinutes?: number): boolean;
  isToday(): boolean;
  hasConflicts(): boolean;
  getConflictCount(): number;
  hasLocation(): boolean;
  hasAttendees(): boolean;
  overlaps(startTime: Date, endTime: Date): boolean;
  getOverlapDuration(startTime: Date, endTime: Date): Date;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  toServerDTO(): ScheduleServerDTO;

  /**
   * 转换为 Client DTO
   */
  toClientDTO(): ScheduleClientDTO;

  /**
   * 克隆当前实体（用于编辑表单）
   */
  clone(): ScheduleClient;
}

/**
 * Schedule 静态工厂方法接口
 */
export interface ScheduleClientStatic {
  /**
   * 从 Server DTO 创建客户端实体
   */
  fromServerDTO(dto: ScheduleServerDTO): ScheduleClient;

  /**
   * 从 Client DTO 创建客户端实体
   */
  fromClientDTO(dto: ScheduleClientDTO): ScheduleClient;

  /**
   * 创建空实例（用于新建表单）
   */
  forCreate(accountUuid: string): ScheduleClient;

  /**
   * 创建新的 Schedule
   */
  create(params: {
    accountUuid: string;
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    priority?: number;
    location?: string;
    attendees?: string[];
  }): ScheduleClient;
}
