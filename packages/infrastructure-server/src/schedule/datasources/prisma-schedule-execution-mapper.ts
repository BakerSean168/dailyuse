/**
 * Prisma Schedule Execution Mapper
 * 负责 Prisma 模型�?ScheduleExecution 实体之间的数据转�?
 *
 * 职责�?
 * - �?Prisma scheduleExecution 模型转换�?ScheduleExecution 实体
 * - �?ScheduleExecution 实体转换�?Prisma 持久化数�?
 */

import type { scheduleExecution as PrismaScheduleExecution } from '@prisma/client';
import { ScheduleExecution } from '@dailyuse/domain-server/schedule';
import type { ExecutionStatus } from '@dailyuse/contracts/schedule';

/**
 * PrismaScheduleExecutionMapper
 * 处理 ScheduleExecution 实体�?Prisma 模型的转�?
 */
export class PrismaScheduleExecutionMapper {
  /**
   * �?Prisma 模型转换�?ScheduleExecution 实体
   */
  public static toDomain(data: PrismaScheduleExecution): ScheduleExecution {
    return ScheduleExecution.fromPersistenceDTO({
      uuid: data.uuid,
      taskUuid: data.taskUuid,
      executionTime: data.executionTime.getTime(),
      status: data.status as ExecutionStatus,
      duration: data.duration ?? undefined,
      result: data.result ?? undefined,
      error: data.error ?? undefined,
      retryCount: data.retryCount,
      createdAt: data.createdAt.getTime(),
    });
  }

  /**
   * �?ScheduleExecution 实体转换�?Prisma 持久化数�?
   */
  public static toPersistence(execution: ScheduleExecution): Omit<PrismaScheduleExecution, 'createdAt'> {
    const dto = execution.toPersistenceDTO();

    return {
      uuid: dto.uuid,
      taskUuid: dto.taskUuid,
      executionTime: new Date(dto.executionTime),
      status: dto.status,
      duration: dto.duration ?? null,
      result: dto.result ?? null,
      error: dto.error ?? null,
      retryCount: dto.retryCount ?? 0,
    };
  }

  /**
   * 转换�?Prisma create 输入数据（包�?createdAt�?
   */
  public static toCreateInput(execution: ScheduleExecution): any {
    const persistence = this.toPersistence(execution);
    const dto = execution.toPersistenceDTO();

    return {
      ...persistence,
      createdAt: new Date(dto.createdAt),
    };
  }

  /**
   * 转换�?Prisma update 输入数据
   */
  public static toUpdateInput(execution: ScheduleExecution): any {
    return this.toPersistence(execution);
  }
}
