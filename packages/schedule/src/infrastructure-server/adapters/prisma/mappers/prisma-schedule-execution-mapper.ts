/**
 * Prisma Schedule Execution Mapper
 * 负责 Prisma 模型�?ScheduleExecution 实体之间的数据转�?
 */

import type { ScheduleExecution as PrismaScheduleExecution } from '@dailyuse/database';
import { ScheduleExecution } from '../../../../domain-server/entities/schedule-execution';
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
    return ScheduleExecution.load({
      id: data.id,
      taskId: data.taskId,
      identityId: (data as any).identityId,
      executionTime: data.executionTime,
      status: data.status as ExecutionStatus,
      duration: data.duration ?? null,
      result: data.result
        ? typeof data.result === 'string'
          ? JSON.parse(data.result as string)
          : (data.result as Record<string, any>)
        : null,
      error: data.error ?? null,
      retryCount: data.retryCount,
      createdAt: data.createdAt,
    });
  }

  /**
   * �?ScheduleExecution 实体转换�?Prisma 持久化数�?
   */
  public static toPersistence(
    execution: ScheduleExecution,
  ): Omit<PrismaScheduleExecution, 'createdAt'> {
    return {
      id: execution.id,
      taskId: execution.taskId,
      identityId: execution.identityId ?? '',
      executionTime: new Date(execution.executionTime),
      status: execution.status,
      duration: execution.duration ?? null,
      result: execution.result ? JSON.stringify(execution.result) : null,
      error: execution.error ?? null,
      retryCount: execution.retryCount ?? 0,
    };
  }

  /**
   * 转换�?Prisma create 输入数据（包�?createdAt�?
   */
  public static toCreateInput(execution: ScheduleExecution): any {
    const persistence = this.toPersistence(execution);

    return {
      ...persistence,
      createdAt: execution.createdAt,
    };
  }

  /**
   * 转换�?Prisma update 输入数据
   */
  public static toUpdateInput(execution: ScheduleExecution): any {
    return this.toPersistence(execution);
  }
}
