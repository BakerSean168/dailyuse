/**
 * Schedule Infrastructure Client - Port Interfaces
 *
 * Transport-agnostic interfaces for Schedule API operations.
 * Implementations: HTTP adapters (web), IPC adapters (desktop)
 *
 * Types imported from @dailyuse/contracts/schedule.
 */

import type { IHttpClient } from '@dailyuse/http-client';
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

// IHttpClient imported from @dailyuse/http-client

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
  createSchedule(data: CreateScheduleRequest): Promise<ScheduleClientDTO>;
  getSchedule(uuid: string): Promise<ScheduleClientDTO>;
  getSchedulesByAccount(): Promise<ScheduleClientDTO[]>;
  getSchedulesByTimeRange(params: GetSchedulesByTimeRangeRequest): Promise<ScheduleClientDTO[]>;
  updateSchedule(uuid: string, data: UpdateScheduleRequest): Promise<ScheduleClientDTO>;
  deleteSchedule(uuid: string): Promise<void>;

  // ===== Schedule Conflict Detection =====
  getScheduleConflicts(uuid: string): Promise<ConflictDetectionResult>;
  detectConflicts(params: {
    userId: string;
    startTime: number;
    endTime: number;
    excludeUuid?: string;
  }): Promise<ConflictDetectionResult>;
  createScheduleWithConflictDetection(
    request: CreateScheduleRequest,
  ): Promise<{
    schedule: ScheduleClientDTO;
    conflicts?: ConflictDetectionResult;
  }>;
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

/**
 * IScheduleTaskApiClient
 *
 * 调度任务 API 客户端接口
 */
export interface IScheduleTaskApiClient {
  // ===== Schedule Task CRUD =====
  createTask(request: CreateScheduleTaskRequest): Promise<ScheduleTaskClientDTO>;
  createTasksBatch(tasks: CreateScheduleTaskRequest[]): Promise<ScheduleTaskClientDTO[]>;
  getTasks(): Promise<{ tasks: ScheduleTaskClientDTO[]; total: number }>;
  getTaskById(taskUuid: string): Promise<ScheduleTaskClientDTO>;
  getDueTasks(params?: { beforeTime?: string; limit?: number }): Promise<ScheduleTaskClientDTO[]>;
  getTaskBySource(sourceModule: SourceModule, sourceEntityId: string): Promise<ScheduleTaskClientDTO[]>;

  // ===== Schedule Task Status Management =====
  pauseTask(taskUuid: string): Promise<void>;
  resumeTask(taskUuid: string): Promise<void>;
  completeTask(taskUuid: string, reason?: string): Promise<void>;
  cancelTask(taskUuid: string, reason?: string): Promise<void>;
  deleteTask(taskUuid: string): Promise<void>;
  deleteTasksBatch(taskUuids: string[]): Promise<void>;
  updateTaskMetadata(
    taskUuid: string,
    metadata: { payload?: unknown; tagsToAdd?: string[]; tagsToRemove?: string[] },
  ): Promise<void>;

  // ===== Schedule Statistics =====
  getStatistics(): Promise<ScheduleStatisticsClientDTO>;
  getModuleStatistics(module: SourceModule): Promise<ModuleStatisticsClientDTO>;
  getAllModuleStatistics(): Promise<Record<SourceModule, ModuleStatisticsClientDTO>>;
  recalculateStatistics(): Promise<ScheduleStatisticsClientDTO>;
  resetStatistics(): Promise<void>;
  deleteStatistics(): Promise<void>;
}
