/**
 * Schedule Event API Client Port
 *
 * 定义日程事件 API 客户端接口。
 * 用于管理日程日历事件。
 */

import type {
  ScheduleClientDTO,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  GetSchedulesByTimeRangeRequest,
  ConflictDetectionResult,
  ResolveConflictRequest,
} from '@dailyuse/contracts/schedule';

/**
 * IScheduleEventApiClient
 *
 * 日程事件 API 客户端接口
 */
export interface IScheduleEventApiClient {
  // ===== Schedule Event CRUD =====

  /**
   * 创建日程事件
   */
  createSchedule(data: CreateScheduleRequest): Promise<ScheduleClientDTO>;

  /**
   * 获取日程事件详情
   */
  getSchedule(uuid: string): Promise<ScheduleClientDTO>;

  /**
   * 获取账户的所有日程事件
   */
  getSchedulesByAccount(): Promise<ScheduleClientDTO[]>;

  /**
   * 获取指定时间范围内的日程事件
   */
  getSchedulesByTimeRange(params: GetSchedulesByTimeRangeRequest): Promise<ScheduleClientDTO[]>;

  /**
   * 更新日程事件
   */
  updateSchedule(uuid: string, data: UpdateScheduleRequest): Promise<ScheduleClientDTO>;

  /**
   * 删除日程事件
   */
  deleteSchedule(uuid: string): Promise<void>;

  // ===== Schedule Conflict Detection =====

  /**
   * 获取日程冲突详情
   */
  getScheduleConflicts(uuid: string): Promise<ConflictDetectionResult>;

  /**
   * 检测日程冲突
   */
  detectConflicts(params: {
    userId: string;
    startTime: number;
    endTime: number;
    excludeUuid?: string;
  }): Promise<ConflictDetectionResult>;

  /**
   * 创建日程（带冲突检测）
   */
  createScheduleWithConflictDetection(
    request: CreateScheduleRequest,
  ): Promise<{
    schedule: ScheduleClientDTO;
    conflicts?: ConflictDetectionResult;
  }>;

  /**
   * 解决日程冲突
   */
  resolveConflict(
    scheduleUuid: string,
    request: ResolveConflictRequest,
  ): Promise<{
    schedule: ScheduleClientDTO;
    conflicts: ConflictDetectionResult;
    applied: {
      strategy: string;
      previousStartTime?: number;
      previousEndTime?: number;
      changes: string[];
    };
  }>;
}
