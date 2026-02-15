/**
 * @deprecated Extract operations to individual service files following governance pattern.
 * Each API operation should have its own service file for better maintainability.
 */

/**
 * Schedule Client Service
 *
 * Constructor-injected application service for schedule management.
 * Uses port interfaces directly, returning Result<T> types throughout.
 *
 * @module application-client/schedule-client-service
 */

import type { Result } from '@dailyuse/contracts/result';
import { map as mapResult } from '@dailyuse/contracts/result';
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
import type {
  IScheduleEventApiClient,
  IScheduleTaskApiClient,
  ScheduleStatisticsClientDTO,
  ModuleStatisticsClientDTO,
} from '@/infrastructure-client/adapters/types';
import { ScheduleTask } from '@/domain-client/aggregates/schedule-task';

export class ScheduleClientService {
  constructor(
    private readonly eventApi: IScheduleEventApiClient,
    private readonly taskApi: IScheduleTaskApiClient,
  ) {}

  // ===== Schedule Event CRUD =====

  async createSchedule(data: CreateScheduleRequest): Promise<Result<ScheduleClientDTO>> {
    return this.eventApi.createSchedule(data);
  }

  async getSchedule(uuid: string): Promise<Result<ScheduleClientDTO>> {
    return this.eventApi.getSchedule(uuid);
  }

  async getSchedulesByAccount(): Promise<Result<ScheduleClientDTO[]>> {
    return this.eventApi.getSchedulesByAccount();
  }

  async getSchedulesByTimeRange(params: GetSchedulesByTimeRangeRequest): Promise<Result<ScheduleClientDTO[]>> {
    return this.eventApi.getSchedulesByTimeRange(params);
  }

  async updateSchedule(uuid: string, data: UpdateScheduleRequest): Promise<Result<ScheduleClientDTO>> {
    return this.eventApi.updateSchedule(uuid, data);
  }

  async deleteSchedule(uuid: string): Promise<Result<void>> {
    return this.eventApi.deleteSchedule(uuid);
  }

  // ===== Schedule Conflict Detection =====

  async getScheduleConflicts(uuid: string): Promise<Result<ConflictDetectionResult>> {
    return this.eventApi.getScheduleConflicts(uuid);
  }

  async detectConflicts(params: {
    userId: string;
    startTime: number;
    endTime: number;
    excludeUuid?: string;
  }): Promise<Result<ConflictDetectionResult>> {
    return this.eventApi.detectConflicts(params);
  }

  async createScheduleWithConflictDetection(
    request: CreateScheduleRequest,
  ): Promise<Result<{
    schedule: ScheduleClientDTO;
    conflicts?: ConflictDetectionResult;
  }>> {
    return this.eventApi.createScheduleWithConflictDetection(request);
  }

  async resolveConflict(
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
  }>> {
    return this.eventApi.resolveConflict(scheduleUuid, request);
  }

  // ===== Schedule Task CRUD =====

  async createTask(request: CreateScheduleTaskRequest): Promise<Result<ScheduleTask>> {
    const result = await this.taskApi.createTask(request);
    return mapResult(result, (dto) => ScheduleTask.fromDTO(dto));
  }

  async createTasksBatch(tasks: CreateScheduleTaskRequest[]): Promise<Result<ScheduleTask[]>> {
    const result = await this.taskApi.createTasksBatch(tasks);
    return mapResult(result, (dtos) => dtos.map((dto) => ScheduleTask.fromDTO(dto)));
  }

  async getTasks(): Promise<Result<{ tasks: ScheduleTask[]; total: number }>> {
    const result = await this.taskApi.getTasks();
    return mapResult(result, (data) => ({
      tasks: data.tasks.map((dto) => ScheduleTask.fromDTO(dto)),
      total: data.total,
    }));
  }

  async getTaskById(taskUuid: string): Promise<Result<ScheduleTask>> {
    const result = await this.taskApi.getTaskById(taskUuid);
    return mapResult(result, (dto) => ScheduleTask.fromDTO(dto));
  }

  async getDueTasks(params?: { beforeTime?: string; limit?: number }): Promise<Result<ScheduleTask[]>> {
    const result = await this.taskApi.getDueTasks(params);
    return mapResult(result, (dtos) => dtos.map((dto) => ScheduleTask.fromDTO(dto)));
  }

  async getTaskBySource(sourceModule: SourceModule, sourceEntityId: string): Promise<Result<ScheduleTask[]>> {
    const result = await this.taskApi.getTaskBySource(sourceModule, sourceEntityId);
    return mapResult(result, (dtos) => dtos.map((dto) => ScheduleTask.fromDTO(dto)));
  }

  // ===== Schedule Task Status Management =====

  async pauseTask(taskUuid: string): Promise<Result<void>> {
    return this.taskApi.pauseTask(taskUuid);
  }

  async resumeTask(taskUuid: string): Promise<Result<void>> {
    return this.taskApi.resumeTask(taskUuid);
  }

  async completeTask(taskUuid: string, reason?: string): Promise<Result<void>> {
    return this.taskApi.completeTask(taskUuid, reason);
  }

  async cancelTask(taskUuid: string, reason?: string): Promise<Result<void>> {
    return this.taskApi.cancelTask(taskUuid, reason);
  }

  async deleteTask(taskUuid: string): Promise<Result<void>> {
    return this.taskApi.deleteTask(taskUuid);
  }

  async deleteTasksBatch(taskUuids: string[]): Promise<Result<void>> {
    return this.taskApi.deleteTasksBatch(taskUuids);
  }

  async updateTaskMetadata(
    taskUuid: string,
    metadata: { payload?: unknown; tagsToAdd?: string[]; tagsToRemove?: string[] },
  ): Promise<Result<void>> {
    return this.taskApi.updateTaskMetadata(taskUuid, metadata);
  }

  // ===== Schedule Statistics =====

  async getStatistics(): Promise<Result<ScheduleStatisticsClientDTO>> {
    return this.taskApi.getStatistics();
  }

  async getModuleStatistics(module: SourceModule): Promise<Result<ModuleStatisticsClientDTO>> {
    return this.taskApi.getModuleStatistics(module);
  }

  async getAllModuleStatistics(): Promise<Result<Record<SourceModule, ModuleStatisticsClientDTO>>> {
    return this.taskApi.getAllModuleStatistics();
  }

  async recalculateStatistics(): Promise<Result<ScheduleStatisticsClientDTO>> {
    return this.taskApi.recalculateStatistics();
  }

  async resetStatistics(): Promise<Result<void>> {
    return this.taskApi.resetStatistics();
  }

  async deleteStatistics(): Promise<Result<void>> {
    return this.taskApi.deleteStatistics();
  }
}
