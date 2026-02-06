/**
 * Prisma Schedule Task Repository
 * ScheduleTask 鑱氬悎鏍?Prisma Repository瀹炵幇
 *
 * 鑱岃矗锛?
 * - 瀹炵幇 IScheduleTaskRepository 鎺ュ彛
 * - 浣跨敤 toPersistenceDTO/fromPersistenceDTO 杩涜鏁版嵁杞崲
 * - 澶勭悊 ScheduleExecution 瀛愬疄浣撶殑绾ц仈鎿嶄綔
 * - 鎻愪緵瀹屾暣鐨勬煡璇㈠拰鎸佷箙鍖栧姛鑳?
 *
 * @implements {IScheduleTaskRepository}
 */

import type { PrismaClient } from '../../../generated/prisma/client';
import type { IScheduleTaskRepository } from '@dailyuse/domain-server/schedule';
import { ScheduleTask, ScheduleExecution } from '@dailyuse/domain-server/schedule';
import { ScheduleTaskStatus } from '@dailyuse/contracts/schedule';
import type { SourceModule, ScheduleTaskPersistenceDTO } from '@dailyuse/contracts/schedule';

/**
 * ScheduleTask 鏌ヨ閫夐」
 */
interface IScheduleTaskQueryOptions {
  accountUuid?: string;
  sourceModule?: SourceModule;
  sourceEntityId?: string;
  status?: ScheduleTaskStatus;
  isEnabled?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * ScheduleTaskRepository
 * 瀹屾暣鐨?DDD Repository瀹炵幇锛屾棤涓存椂閫傞厤浠ｇ爜
 */
export class ScheduleTaskPrismaRepository implements IScheduleTaskRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 鏁版嵁杞崲鏂规硶 =====

  /**
   * 浠?Prisma 妯″瀷杞崲涓?ScheduleTask 鑱氬悎鏍?
   * 浣跨敤鑱氬悎鏍圭殑 fromPersistenceDTO 鏂规硶
   */
  private toDomain(data: any): ScheduleTask {
    // 鏋勫缓 PersistenceDTO锛堟墍鏈夊瓧娈甸兘鏄墎骞冲寲鐨勶級
    const persistenceDTO: ScheduleTaskPersistenceDTO = {
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      name: data.name,
      description: data.description,
      sourceModule: data.sourceModule,
      sourceEntityId: data.sourceEntityId,
      status: data.status,
      enabled: data.enabled,
      // ScheduleConfig 鎵佸钩鍖栧瓧娈?
      cronExpression: data.cronExpression,
      timezone: data.timezone,
      startDate: data.startDate ? data.startDate.getTime() : null,
      endDate: data.endDate ? data.endDate.getTime() : null,
      maxExecutions: data.maxExecutions,
      // ExecutionInfo 鎵佸钩鍖栧瓧娈?
      nextRunAt: data.nextRunAt ? data.nextRunAt.getTime() : null,
      lastRunAt: data.lastRunAt ? data.lastRunAt.getTime() : null,
      executionCount: data.executionCount,
      lastExecutionStatus: data.lastExecutionStatus,
      lastExecutionDuration: data.lastExecutionDuration,
      consecutiveFailures: data.consecutiveFailures,
      // RetryPolicy 鎵佸钩鍖栧瓧娈?
      maxRetries: data.maxRetries,
      initialDelayMs: data.initialDelayMs,
      maxDelayMs: data.maxDelayMs,
      backoffMultiplier: data.backoffMultiplier,
      retryableStatuses: data.retryableStatuses,
      // TaskMetadata 鎵佸钩鍖栧瓧娈?
      payload: data.payload,
      tags: data.tags,
      priority: data.priority,
      timeout: data.timeout,
      // 鏃堕棿鎴?
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
    };

    // 浣跨敤鑱氬悎鏍圭殑 fromPersistenceDTO 鏂规硶Create瀹炰緥
    const task = ScheduleTask.fromPersistenceDTO(persistenceDTO);

    // 鎭㈠鎵цRecord瀛愬疄浣?
    if (data.scheduleExecution && data.scheduleExecution.length > 0) {
      for (const execData of data.scheduleExecution) {
        const execution = ScheduleExecution.fromPersistenceDTO({
          uuid: execData.uuid,
          taskUuid: execData.taskUuid,
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
   * 浠?ScheduleTask 鑱氬悎鏍硅浆鎹负 Prisma 鎸佷箙鍖栨暟鎹?
   * 浣跨敤鑱氬悎鏍圭殑 toPersistenceDTO 鏂规硶
   */
  private toPrisma(task: ScheduleTask): any {
    const dto = task.toPersistenceDTO();

    return {
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      sourceModule: dto.sourceModule,
      sourceEntityId: dto.sourceEntityId,
      status: dto.status,
      enabled: dto.enabled,
      // ScheduleConfig 鎵佸钩鍖栧瓧娈?
      cronExpression: dto.cronExpression,
      timezone: dto.timezone,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      maxExecutions: dto.maxExecutions,
      // ExecutionInfo 鎵佸钩鍖栧瓧娈?
      nextRunAt: dto.nextRunAt ? new Date(dto.nextRunAt) : null,
      lastRunAt: dto.lastRunAt ? new Date(dto.lastRunAt) : null,
      executionCount: dto.executionCount,
      lastExecutionStatus: dto.lastExecutionStatus,
      lastExecutionDuration: dto.lastExecutionDuration,
      consecutiveFailures: dto.consecutiveFailures,
      // RetryPolicy 鎵佸钩鍖栧瓧娈?
      maxRetries: dto.maxRetries ?? 3,
      initialDelayMs: dto.initialDelayMs ?? 1000,
      maxDelayMs: dto.maxDelayMs ?? 30000,
      backoffMultiplier: dto.backoffMultiplier ?? 2,
      retryableStatuses: dto.retryableStatuses ?? '[]',
      // TaskMetadata 鎵佸钩鍖栧瓧娈?
      payload: typeof dto.payload === 'string' ? dto.payload : JSON.stringify(dto.payload),
      tags: dto.tags,
      priority: dto.priority,
      timeout: dto.timeout,
      // 鏃堕棿鎴?
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }

  // ===== 鍩烘湰 CRUD =====

  async save(task: ScheduleTask): Promise<void> {
    const data = this.toPrisma(task);

    await this.prisma.scheduleTask.upsert({
      where: { uuid: data.uuid },
      create: data,
      update: data,
    });

    // Save鎵цRecord锛堝鏋滄湁锛?
    const executions = task.executions;
    if (executions && executions.length > 0) {
      for (const execution of executions) {
        const execDto = execution.toPersistenceDTO();
        await this.prisma.scheduleExecution.upsert({
          where: { uuid: execDto.uuid },
          create: {
            uuid: execDto.uuid,
            taskUuid: execDto.taskUuid,
            executionTime: new Date(execDto.executionTime),
            status: execDto.status,
            duration: execDto.duration ?? null,
            result: execDto.result ?? null,
            error: execDto.error ?? null,
            retryCount: execDto.retryCount ?? 0,
          },
          update: {
            status: execDto.status,
            duration: execDto.duration ?? null,
            result: execDto.result ?? null,
            error: execDto.error ?? null,
            retryCount: execDto.retryCount ?? 0,
          },
        });
      }
    }
  }

  async findByUuid(uuid: string): Promise<ScheduleTask | null> {
    const data = await this.prisma.scheduleTask.findUnique({
      where: { uuid },
      include: {
        scheduleExecution: {
          orderBy: { createdAt: 'desc' },
          take: 10, // 鏈€杩?10 鏉℃墽琛岃褰?
        },
      },
    });

    return data ? this.toDomain(data) : null;
  }

  async deleteByUuid(uuid: string): Promise<void> {
    await this.prisma.scheduleTask.delete({
      where: { uuid },
    });
  }

  // ===== 鏌ヨ鏂规硶 =====

  async findByAccountUuid(accountUuid: string): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: { accountUuid },
      include: {
        scheduleExecution: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.toDomain(task));
  }

  async findBySourceModule(module: SourceModule, accountUuid?: string): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        sourceModule: module,
        ...(accountUuid && { accountUuid }),
      },
      include: {
        scheduleExecution: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.toDomain(task));
  }

  async findBySourceEntity(
    module: SourceModule,
    entityId: string,
    accountUuid?: string,
  ): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        sourceModule: module,
        sourceEntityId: entityId,
        ...(accountUuid && { accountUuid }),
      },
      include: {
        scheduleExecution: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.toDomain(task));
  }

  async findByStatus(status: ScheduleTaskStatus, accountUuid?: string): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        status: status,
        ...(accountUuid && { accountUuid }),
      },
      include: {
        scheduleExecution: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.toDomain(task));
  }

  async findEnabled(accountUuid?: string): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        enabled: true,
        ...(accountUuid && { accountUuid }),
      },
      include: {
        scheduleExecution: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.toDomain(task));
  }

  async findDueTasksForExecution(beforeTime: Date, limit?: number): Promise<ScheduleTask[]> {
    // 鉁?浼樺寲瀹屾垚锛佺幇鍦?nextRunAt 鏄嫭绔嬪瓧娈碉紝鍙互鐩存帴鐢?SQL 鏌ヨ
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        enabled: true,
        status: ScheduleTaskStatus.ACTIVE,
        nextRunAt: {
          lte: beforeTime, // 猸?鐩存帴 SQL 鏌ヨ锛?
        },
      },
      orderBy: {
        nextRunAt: 'asc', // 鎸夋墽琛屾椂闂存帓搴?
      },
      take: limit,
      include: {
        scheduleExecution: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.toDomain(task));
  }

  async query(options: IScheduleTaskQueryOptions): Promise<ScheduleTask[]> {
    const where: any = {};

    if (options.accountUuid) where.accountUuid = options.accountUuid;
    if (options.sourceModule) where.sourceModule = options.sourceModule;
    if (options.sourceEntityId) where.sourceEntityId = options.sourceEntityId;
    if (options.status) where.status = options.status;
    if (options.isEnabled !== undefined) where.enabled = options.isEnabled;

    const tasks = await this.prisma.scheduleTask.findMany({
      where,
      include: {
        scheduleExecution: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      take: options.limit,
      skip: options.offset,
    });

    return tasks.map((task) => this.toDomain(task));
  }

  async count(options: IScheduleTaskQueryOptions): Promise<number> {
    const where: any = {};

    if (options.accountUuid) where.accountUuid = options.accountUuid;
    if (options.sourceModule) where.sourceModule = options.sourceModule;
    if (options.sourceEntityId) where.sourceEntityId = options.sourceEntityId;
    if (options.status) where.status = options.status;
    if (options.isEnabled !== undefined) where.enabled = options.isEnabled;

    return this.prisma.scheduleTask.count({ where });
  }

  // ===== 鎵归噺鎿嶄綔 =====

  async saveBatch(tasks: ScheduleTask[]): Promise<void> {
    for (const task of tasks) {
      await this.save(task);
    }
  }

  async deleteBatch(uuids: string[]): Promise<void> {
    await this.prisma.scheduleTask.deleteMany({
      where: {
        uuid: {
          in: uuids,
        },
      },
    });
  }

  // ===== 浜嬪姟鏀寔 =====

  async withTransaction<T>(fn: (repo: IScheduleTaskRepository) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const txRepo = new ScheduleTaskPrismaRepository(tx as PrismaClient);
      return fn(txRepo);
    });
  }
}


