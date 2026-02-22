/**
 * Prisma ScheduleTask Mapper
 *
 * Maps between ScheduleTask domain aggregate and Prisma model.
 * Handles aggregate root + child entity (ScheduleExecution) conversion.
 */

import type {
  ScheduleTask as PrismaScheduleTask,
  ScheduleExecution as PrismaScheduleExecution,
} from '@dailyuse/database';
import type { SourceModule, ScheduleTaskStatus, ScheduleTaskPersistenceDTO } from '@dailyuse/contracts/schedule';
import { ScheduleTask } from '../../../domain-server/aggregates/schedule-task';
import { ScheduleExecution } from '../../../domain-server/entities/schedule-execution';

/**
 * Prisma ScheduleTask with optional executions relation
 */
export type PrismaScheduleTaskWithExecutions = PrismaScheduleTask & {
  executions?: PrismaScheduleExecution[];
};

export class PrismaScheduleTaskMapper {
  /**
   * Prisma record → ScheduleTask aggregate root (with optional executions)
   */
  static toDomain(data: PrismaScheduleTaskWithExecutions): ScheduleTask {
    const persistenceDTO: ScheduleTaskPersistenceDTO = {
      id: data.id,
      identityId: data.identityId,
      name: data.name,
      description: data.description,
      sourceModule: data.sourceModule as SourceModule,
      sourceEntityId: data.sourceEntityId,
      status: data.status as ScheduleTaskStatus,
      enabled: data.enabled,
      cronExpression: data.cronExpression,
      timezone: data.timezone,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      maxExecutions: data.maxExecutions,
      nextRunAt: data.nextRunAt ?? null,
      lastRunAt: data.lastRunAt ?? null,
      executionCount: data.executionCount,
      lastExecutionStatus: data.lastExecutionStatus,
      lastExecutionDuration: data.lastExecutionDuration,
      consecutiveFailures: data.consecutiveFailures,
      maxRetries: data.maxRetries,
      initialDelayMs: data.initialDelayMs,
      maxDelayMs: data.maxDelayMs,
      backoffMultiplier: data.backoffMultiplier,
      retryableStatuses: data.retryableStatuses,
      payload: data.payload,
      tags: data.tags,
      priority: data.priority,
      timeout: data.timeout,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      version: data.version ?? 1,
      deletedAt: data.deletedAt ?? null,
    };

    const task = ScheduleTask.fromPersistenceDTO(persistenceDTO);

    // Load child entities - executions
    if (data.executions && data.executions.length > 0) {
      for (const execData of data.executions) {
        const execution = ScheduleExecution.fromPersistenceDTO({
          id: execData.id,
          taskId: execData.taskId,
          executionTime: execData.executionTime.getTime(),
          status: execData.status,
          duration: execData.duration ?? undefined,
          result: execData.result ?? undefined,
          error: execData.error ?? undefined,
          retryCount: execData.retryCount,
          createdAt: execData.createdAt.getTime(),
        });
        task.addExecution(execution);
      }
    }

    return task;
  }

  /**
   * ScheduleTask aggregate → Prisma write data
   */
  static toPersistence(task: ScheduleTask) {
    const dto = task.toPersistenceDTO();
    return {
      id: dto.id,
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      sourceModule: dto.sourceModule,
      sourceEntityId: dto.sourceEntityId,
      status: dto.status,
      enabled: dto.enabled,
      cronExpression: dto.cronExpression,
      timezone: dto.timezone,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      maxExecutions: dto.maxExecutions,
      nextRunAt: dto.nextRunAt ? new Date(dto.nextRunAt) : null,
      lastRunAt: dto.lastRunAt ? new Date(dto.lastRunAt) : null,
      executionCount: dto.executionCount,
      lastExecutionStatus: dto.lastExecutionStatus,
      lastExecutionDuration: dto.lastExecutionDuration,
      consecutiveFailures: dto.consecutiveFailures,
      maxRetries: dto.maxRetries ?? 3,
      initialDelayMs: dto.initialDelayMs ?? 1000,
      maxDelayMs: dto.maxDelayMs ?? 30000,
      backoffMultiplier: dto.backoffMultiplier ?? 2,
      retryableStatuses: dto.retryableStatuses ?? '[]',
      payload: typeof dto.payload === 'string' ? dto.payload : JSON.stringify(dto.payload),
      tags: dto.tags,
      priority: dto.priority,
      timeout: dto.timeout,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }
}
