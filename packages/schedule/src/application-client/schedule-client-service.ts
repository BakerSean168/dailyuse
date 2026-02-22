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
  CalendarEntryClientDTO,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  GetSchedulesByTimeRangeRequest,
  ConflictDetectionResult,
  ResolveConflictRequest,
  SourceModule,
  ScheduleTaskClientDTO,
  ScheduleExecutionClientDTO,
  CreateScheduleTaskRequest,
} from '@dailyuse/contracts/schedule';
import type {
  IScheduleEventApiClient,
  IScheduleTaskApiClient,
  ScheduleStatisticsClientDTO,
  ModuleStatisticsClientDTO,
} from '@/infrastructure-client/adapters/types';
import {
  ScheduleTask,
  ScheduleConfigVO,
  ExecutionInfoVO,
  RetryPolicyVO,
  TaskMetadataVO,
} from '@/domain-client/aggregates/schedule-task';
import { ScheduleExecution } from '@/domain-client/entities/schedule-execution';
import { ScheduleTaskId } from '@/domain-shared/value-objects/schedule-task-id';
import { ScheduleExecutionId } from '@/domain-shared/value-objects/schedule-execution-id';
import { IdentityId } from '@dailyuse/domain-shared';

// ===== DTO-to-State Mappers =====

function scheduleExecutionFromDTO(dto: ScheduleExecutionClientDTO): ScheduleExecution {
  return ScheduleExecution.load({
    id: ScheduleExecutionId.of(dto.id),
    scheduleTaskId: ScheduleTaskId.of(dto.scheduleTaskId),
    executionTime: new Date(dto.executionTime),
    status: dto.status,
    duration: dto.duration,
    result: dto.result,
    error: dto.error,
    retryCount: dto.retryCount,
    version: dto.version,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    executionTimeFormatted: dto.executionTimeFormatted,
    statusDisplay: dto.statusDisplay,
    statusColor: dto.statusColor,
    durationFormatted: dto.durationFormatted,
    hasError: dto.hasError,
    hasResult: dto.hasResult,
    resultSummary: dto.resultSummary,
  });
}

function scheduleTaskFromDTO(dto: ScheduleTaskClientDTO): ScheduleTask {
  return ScheduleTask.load({
    id: ScheduleTaskId.of(dto.id),
    identityId: IdentityId.of(dto.identityId),
    name: dto.name,
    description: dto.description,
    sourceModule: dto.sourceModule,
    sourceEntityId: dto.sourceEntityId,
    status: dto.status,
    enabled: dto.enabled,
    schedule: new ScheduleConfigVO(dto.schedule),
    execution: new ExecutionInfoVO(dto.execution),
    retryPolicy: new RetryPolicyVO(dto.retryPolicy),
    metadata: new TaskMetadataVO(dto.metadata),
    version: dto.version,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    statusDisplay: dto.statusDisplay,
    statusColor: dto.statusColor,
    sourceModuleDisplay: dto.sourceModuleDisplay,
    enabledDisplay: dto.enabledDisplay,
    nextRunAtFormatted: dto.nextRunAtFormatted,
    lastRunAtFormatted: dto.lastRunAtFormatted,
    executionSummary: dto.executionSummary,
    healthStatus: dto.healthStatus,
    isOverdue: dto.isOverdue,
    executions: dto.executions
      ? dto.executions.map((e) => scheduleExecutionFromDTO(e))
      : null,
  });
}

export class ScheduleClientService {
  constructor(
    private readonly eventApi: IScheduleEventApiClient,
    private readonly taskApi: IScheduleTaskApiClient,
  ) {}

  // ===== Schedule Event CRUD =====

  async createSchedule(data: CreateScheduleRequest): Promise<Result<CalendarEntryClientDTO>> {
    return this.eventApi.createSchedule(data);
  }

  async getSchedule(id: string): Promise<Result<CalendarEntryClientDTO>> {
    return this.eventApi.getSchedule(id);
  }

  async getSchedulesByAccount(): Promise<Result<CalendarEntryClientDTO[]>> {
    return this.eventApi.getSchedulesByAccount();
  }

  async getSchedulesByTimeRange(params: GetSchedulesByTimeRangeRequest): Promise<Result<CalendarEntryClientDTO[]>> {
    return this.eventApi.getSchedulesByTimeRange(params);
  }

  async updateSchedule(id: string, data: UpdateScheduleRequest): Promise<Result<CalendarEntryClientDTO>> {
    return this.eventApi.updateSchedule(id, data);
  }

  async deleteSchedule(id: string): Promise<Result<void>> {
    return this.eventApi.deleteSchedule(id);
  }

  // ===== Schedule Conflict Detection =====

  async getScheduleConflicts(id: string): Promise<Result<ConflictDetectionResult>> {
    return this.eventApi.getScheduleConflicts(id);
  }

  async detectConflicts(params: {
    userId: string;
    startTime: number;
    endTime: number;
    excludeId?: string;
  }): Promise<Result<ConflictDetectionResult>> {
    return this.eventApi.detectConflicts(params);
  }

  async createScheduleWithConflictDetection(
    request: CreateScheduleRequest,
  ): Promise<Result<{
    schedule: CalendarEntryClientDTO;
    conflicts?: ConflictDetectionResult;
  }>> {
    return this.eventApi.createScheduleWithConflictDetection(request);
  }

  async resolveConflict(
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
  }>> {
    return this.eventApi.resolveConflict(scheduleId, request);
  }

  // ===== Schedule Task CRUD =====

  async createTask(request: CreateScheduleTaskRequest): Promise<Result<ScheduleTask>> {
    const result = await this.taskApi.createTask(request);
    return mapResult(result, (dto) => scheduleTaskFromDTO(dto));
  }

  async createTasksBatch(tasks: CreateScheduleTaskRequest[]): Promise<Result<ScheduleTask[]>> {
    const result = await this.taskApi.createTasksBatch(tasks);
    return mapResult(result, (dtos) => dtos.map((dto) => scheduleTaskFromDTO(dto)));
  }

  async getTasks(): Promise<Result<{ tasks: ScheduleTask[]; total: number }>> {
    const result = await this.taskApi.getTasks();
    return mapResult(result, (data) => ({
      tasks: data.tasks.map((dto) => scheduleTaskFromDTO(dto)),
      total: data.total,
    }));
  }

  async getTaskById(taskId: string): Promise<Result<ScheduleTask>> {
    const result = await this.taskApi.getTaskById(taskId);
    return mapResult(result, (dto) => scheduleTaskFromDTO(dto));
  }

  async getDueTasks(params?: { beforeTime?: string; limit?: number }): Promise<Result<ScheduleTask[]>> {
    const result = await this.taskApi.getDueTasks(params);
    return mapResult(result, (dtos) => dtos.map((dto) => scheduleTaskFromDTO(dto)));
  }

  async getTaskBySource(sourceModule: SourceModule, sourceEntityId: string): Promise<Result<ScheduleTask[]>> {
    const result = await this.taskApi.getTaskBySource(sourceModule, sourceEntityId);
    return mapResult(result, (dtos) => dtos.map((dto) => scheduleTaskFromDTO(dto)));
  }

  // ===== Schedule Task Status Management =====

  async pauseTask(taskId: string): Promise<Result<void>> {
    return this.taskApi.pauseTask(taskId);
  }

  async resumeTask(taskId: string): Promise<Result<void>> {
    return this.taskApi.resumeTask(taskId);
  }

  async completeTask(taskId: string, reason?: string): Promise<Result<void>> {
    return this.taskApi.completeTask(taskId, reason);
  }

  async cancelTask(taskId: string, reason?: string): Promise<Result<void>> {
    return this.taskApi.cancelTask(taskId, reason);
  }

  async deleteTask(taskId: string): Promise<Result<void>> {
    return this.taskApi.deleteTask(taskId);
  }

  async deleteTasksBatch(taskIds: string[]): Promise<Result<void>> {
    return this.taskApi.deleteTasksBatch(taskIds);
  }

  async updateTaskMetadata(
    taskId: string,
    metadata: { payload?: unknown; tagsToAdd?: string[]; tagsToRemove?: string[] },
  ): Promise<Result<void>> {
    return this.taskApi.updateTaskMetadata(taskId, metadata);
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
