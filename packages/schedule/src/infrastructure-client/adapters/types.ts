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
  ScheduleClientDTO,
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

// ============ Schedule Statistics DTOs ============
// 合约包暂未定义，临时本地声明

export interface ScheduleStatisticsClientDTO {
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
  cancelledTasks: number;
  pausedTasks: number;
}

export interface ModuleStatisticsClientDTO {
  module: SourceModule;
  totalTasks: number;
  activeTasks: number;
  completedTasks: number;
}

// ============ Port Interfaces ============

/**
 * IScheduleEventApiClient
 *
 * 日程事件 API 客户端接口
 */
export interface IScheduleEventApiClient {
  // ===== Schedule Event CRUD =====
  createSchedule(data: CreateScheduleRequest): Promise<Result<ScheduleClientDTO>>;
  getSchedule(uuid: string): Promise<Result<ScheduleClientDTO>>;
  getSchedulesByAccount(): Promise<Result<ScheduleClientDTO[]>>;
  getSchedulesByTimeRange(params: GetSchedulesByTimeRangeRequest): Promise<Result<ScheduleClientDTO[]>>;
  updateSchedule(uuid: string, data: UpdateScheduleRequest): Promise<Result<ScheduleClientDTO>>;
  deleteSchedule(uuid: string): Promise<Result<void>>;

  // ===== Schedule Conflict Detection =====
  getScheduleConflicts(uuid: string): Promise<Result<ConflictDetectionResult>>;
  detectConflicts(params: {
    userId: string;
    startTime: number;
    endTime: number;
    excludeUuid?: string;
  }): Promise<Result<ConflictDetectionResult>>;
  createScheduleWithConflictDetection(
    request: CreateScheduleRequest,
  ): Promise<Result<{
    schedule: ScheduleClientDTO;
    conflicts?: ConflictDetectionResult;
  }>>;
  resolveConflict(
    scheduleUuid: string,
    request: ResolveConflictRequest,
  ): Promise<Result<{
    schedule: ScheduleClientDTO;
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
  getTaskById(taskUuid: string): Promise<Result<ScheduleTaskClientDTO>>;
  getDueTasks(params?: { beforeTime?: string; limit?: number }): Promise<Result<ScheduleTaskClientDTO[]>>;
  getTaskBySource(sourceModule: SourceModule, sourceEntityId: string): Promise<Result<ScheduleTaskClientDTO[]>>;

  // ===== Schedule Task Status Management =====
  pauseTask(taskUuid: string): Promise<Result<void>>;
  resumeTask(taskUuid: string): Promise<Result<void>>;
  completeTask(taskUuid: string, reason?: string): Promise<Result<void>>;
  cancelTask(taskUuid: string, reason?: string): Promise<Result<void>>;
  deleteTask(taskUuid: string): Promise<Result<void>>;
  deleteTasksBatch(taskUuids: string[]): Promise<Result<void>>;
  updateTaskMetadata(
    taskUuid: string,
    metadata: { payload?: unknown; tagsToAdd?: string[]; tagsToRemove?: string[] },
  ): Promise<Result<void>>;

  // ===== Schedule Statistics =====
  getStatistics(): Promise<Result<ScheduleStatisticsClientDTO>>;
  getModuleStatistics(module: SourceModule): Promise<Result<ModuleStatisticsClientDTO>>;
  getAllModuleStatistics(): Promise<Result<Record<SourceModule, ModuleStatisticsClientDTO>>>;
  recalculateStatistics(): Promise<Result<ScheduleStatisticsClientDTO>>;
  resetStatistics(): Promise<Result<void>>;
  deleteStatistics(): Promise<Result<void>>;
}
