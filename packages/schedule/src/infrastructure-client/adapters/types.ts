/**
 * Schedule Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for Schedule API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/schedule.
 */

import type { Result } from '@dailyuse/contracts/result';
import type { IResultHttpClient } from '@dailyuse/http-client';
import type {
  CalendarEntryClientDTO,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  GetSchedulesByTimeRangeRequest,
  ConflictDetectionResult,
  ResolveConflictRequest,
  SourceModule,
  ScheduleTaskClientDTO,
  CreateScheduleTaskRequest,
} from '@dailyuse/contracts/schedule';

// ============ Transport Client Interfaces ============
// Module only defines what it needs — concrete implementations injected from App layer.

// IResultHttpClient imported from @dailyuse/http-client

/**
 * IPC Client interface.
 * Satisfied by IpcClientImpl / ResultIpcClient at the App level.
 */
export interface IIpcClient {
  invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T>;
}

// ============ Port Interfaces ============

/**
 * IScheduleEventApiClient
 *
 * 日程事件 API 客户端接口
 */
export interface IScheduleEventApiClient {
  // ===== Schedule Event CRUD =====
  createSchedule(data: CreateScheduleRequest): Promise<Result<CalendarEntryClientDTO>>;
  getSchedule(id: string): Promise<Result<CalendarEntryClientDTO>>;
  getSchedulesByAccount(): Promise<Result<CalendarEntryClientDTO[]>>;
  getSchedulesByTimeRange(params: GetSchedulesByTimeRangeRequest): Promise<Result<CalendarEntryClientDTO[]>>;
  updateSchedule(id: string, data: UpdateScheduleRequest): Promise<Result<CalendarEntryClientDTO>>;
  deleteSchedule(id: string): Promise<Result<void>>;

  // ===== Schedule Conflict Detection =====
  getScheduleConflicts(id: string): Promise<Result<ConflictDetectionResult>>;
  detectConflicts(params: {
    userId: string;
    startTime: number;
    endTime: number;
    excludeId?: string;
  }): Promise<Result<ConflictDetectionResult>>;
  createScheduleWithConflictDetection(
    request: CreateScheduleRequest,
  ): Promise<Result<{
    schedule: CalendarEntryClientDTO;
    conflicts?: ConflictDetectionResult;
  }>>;
  resolveConflict(
    scheduleId: string,
    request: ResolveConflictRequest,
  ): Promise<Result<{
    schedule: CalendarEntryClientDTO;
    conflicts: ConflictDetectionResult;
    applied: {
      strategy: string;
      previousStartTime?: number;
      previousEndTime?: number;
      changes: string[];
    };
  }>>;
}

/**
 * IScheduleTaskApiClient
 *
 * 调度任务 API 客户端接口
 */
export interface IScheduleTaskApiClient {
  // ===== Schedule Task CRUD =====
  createTask(request: CreateScheduleTaskRequest): Promise<Result<ScheduleTaskClientDTO>>;
  createTasksBatch(tasks: CreateScheduleTaskRequest[]): Promise<Result<ScheduleTaskClientDTO[]>>;
  getTasks(): Promise<Result<{ tasks: ScheduleTaskClientDTO[]; total: number }>>;
  getTaskById(taskId: string): Promise<Result<ScheduleTaskClientDTO>>;
  getDueTasks(params?: { beforeTime?: string; limit?: number }): Promise<Result<ScheduleTaskClientDTO[]>>;
  getTaskBySource(sourceModule: SourceModule, sourceEntityId: string): Promise<Result<ScheduleTaskClientDTO[]>>;

  // ===== Schedule Task Status Management =====
  pauseTask(taskId: string): Promise<Result<void>>;
  resumeTask(taskId: string): Promise<Result<void>>;
  completeTask(taskId: string, reason?: string): Promise<Result<void>>;
  cancelTask(taskId: string, reason?: string): Promise<Result<void>>;
  deleteTask(taskId: string): Promise<Result<void>>;
  deleteTasksBatch(taskIds: string[]): Promise<Result<void>>;
  updateTaskMetadata(
    taskId: string,
    metadata: { payload?: unknown; tagsToAdd?: string[]; tagsToRemove?: string[] },
  ): Promise<Result<void>>;
}
