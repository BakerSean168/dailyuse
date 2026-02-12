/**
 * Prisma Schedule Execution Mapper
 * 璐熻矗 Prisma 妯″瀷涓?ScheduleExecution 瀹炰綋涔嬮棿鐨勬暟鎹浆鎹?
 *
 * 鑱岃矗锛?
 * - 灏?Prisma scheduleExecution 妯″瀷杞崲涓?ScheduleExecution 瀹炰綋
 * - 灏?ScheduleExecution 瀹炰綋杞崲涓?Prisma 鎸佷箙鍖栨暟鎹?
 */

import type { scheduleExecution as PrismaScheduleExecution } from '../../generated/prisma/client';
import { ScheduleExecution } from '../../domain-server/entities/schedule-execution';
import type { ExecutionStatus } from '@dailyuse/contracts/schedule';

/**
 * PrismaScheduleExecutionMapper
 * 澶勭悊 ScheduleExecution 瀹炰綋涓?Prisma 妯″瀷鐨勮浆鎹?
 */
export class PrismaScheduleExecutionMapper {
  /**
   * 浠?Prisma 妯″瀷杞崲涓?ScheduleExecution 瀹炰綋
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
   * 灏?ScheduleExecution 瀹炰綋杞崲涓?Prisma 鎸佷箙鍖栨暟鎹?
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
   * 杞崲涓?Prisma create 杈撳叆鏁版嵁锛堝寘AndcreatedAt锛?
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
   * 杞崲涓?Prisma update 杈撳叆鏁版嵁
   */
  public static toUpdateInput(execution: ScheduleExecution): any {
    return this.toPersistence(execution);
  }
}
