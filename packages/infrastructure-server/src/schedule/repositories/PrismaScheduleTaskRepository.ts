/**
 * Prisma Schedule Task Repository
 * ScheduleTask 聚合根 Prisma 仓储实现
 *
 * 职责：
 * - 实现 IScheduleTaskRepository 接口
 * - 使用 toPersistenceDTO/fromPersistenceDTO 进行数据转换
 * - 处理 ScheduleExecution 子实体的级联操作
 * - 提供完整的查询和持久化功能
 *
 * @implements {IScheduleTaskRepository}
 */

import type { PrismaClient } from '@prisma/client';
import type { IScheduleTaskRepository } from '@dailyuse/domain-server/schedule';
import { ScheduleTask, ScheduleExecution } from '@dailyuse/domain-server/schedule';
import { ScheduleTaskStatus } from '@dailyuse/contracts/schedule';
import type { SourceModule, ScheduleTaskPersistenceDTO } from '@dailyuse/contracts/schedule';

/**
 * ScheduleTask 查询选项
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
 * PrismaScheduleTaskRepository
 * 完整的 DDD 仓储实现，无临时适配代码
 */
export class PrismaScheduleTaskRepository implements IScheduleTaskRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 数据转换方法 =====

  /**
   * 从 Prisma 模型转换为 ScheduleTask 聚合根
   * 使用聚合根的 fromPersistenceDTO 方法
   */
  private toDomain(data: any): ScheduleTask {
    // 构建 PersistenceDTO（所有字段都是扁平化的）
    const persistenceDTO: ScheduleTaskPersistenceDTO = {
      uuid: data.uuid,
      accountUuid: data.accountUuid,
      name: data.name,
      description: data.description,
      sourceModule: data.sourceModule,
      sourceEntityId: data.sourceEntityId,
      status: data.status,
      enabled: data.enabled,
      // ScheduleConfig 扁平化字段
      cronExpression: data.cronExpression,
      timezone: data.timezone,
      startDate: data.startDate ? data.startDate.getTime() : null,
      endDate: data.endDate ? data.endDate.getTime() : null,
      maxExecutions: data.maxExecutions,
      // ExecutionInfo 扁平化字段
      nextRunAt: data.nextRunAt ? data.nextRunAt.getTime() : null,
      lastRunAt: data.lastRunAt ? data.lastRunAt.getTime() : null,
      executionCount: data.executionCount,
      lastExecutionStatus: data.lastExecutionStatus,
      lastExecutionDuration: data.lastExecutionDuration,
      consecutiveFailures: data.consecutiveFailures,
      // RetryPolicy 扁平化字段
      maxRetries: data.maxRetries,
      initialDelayMs: data.initialDelayMs,
      maxDelayMs: data.maxDelayMs,
      backoffMultiplier: data.backoffMultiplier,
      retryableStatuses: data.retryableStatuses,
      // TaskMetadata 扁平化字段
      payload: data.payload,
      tags: data.tags,
      priority: data.priority,
      timeout: data.timeout,
      // 时间戳
      createdAt: data.createdAt.getTime(),
      updatedAt: data.updatedAt.getTime(),
    };

    // 使用聚合根的 fromPersistenceDTO 方法创建实例
    const task = ScheduleTask.fromPersistenceDTO(persistenceDTO);

    // 恢复执行记录子实体
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
   * 从 ScheduleTask 聚合根转换为 Prisma 持久化数据
   * 使用聚合根的 toPersistenceDTO 方法
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
      // ScheduleConfig 扁平化字段
      cronExpression: dto.cronExpression,
      timezone: dto.timezone,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      maxExecutions: dto.maxExecutions,
      // ExecutionInfo 扁平化字段
      nextRunAt: dto.nextRunAt ? new Date(dto.nextRunAt) : null,
      lastRunAt: dto.lastRunAt ? new Date(dto.lastRunAt) : null,
      executionCount: dto.executionCount,
      lastExecutionStatus: dto.lastExecutionStatus,
      lastExecutionDuration: dto.lastExecutionDuration,
      consecutiveFailures: dto.consecutiveFailures,
      // RetryPolicy 扁平化字段
      maxRetries: dto.maxRetries ?? 3,
      initialDelayMs: dto.initialDelayMs ?? 1000,
      maxDelayMs: dto.maxDelayMs ?? 30000,
      backoffMultiplier: dto.backoffMultiplier ?? 2,
      retryableStatuses: dto.retryableStatuses ?? '[]',
      // TaskMetadata 扁平化字段
      payload: typeof dto.payload === 'string' ? dto.payload : JSON.stringify(dto.payload),
      tags: dto.tags,
      priority: dto.priority,
      timeout: dto.timeout,
      // 时间戳
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }

  // ===== 基本 CRUD =====

  async save(task: ScheduleTask): Promise<void> {
    const data = this.toPrisma(task);

    await this.prisma.scheduleTask.upsert({
      where: { uuid: data.uuid },
      create: data,
      update: data,
    });

    // 保存执行记录（如果有）
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
          take: 10, // 最近 10 条执行记录
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

  // ===== 查询方法 =====

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
    // ✅ 优化完成！现在 nextRunAt 是独立字段，可以直接用 SQL 查询
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        enabled: true,
        status: ScheduleTaskStatus.ACTIVE,
        nextRunAt: {
          lte: beforeTime, // ⭐ 直接 SQL 查询！
        },
      },
      orderBy: {
        nextRunAt: 'asc', // 按执行时间排序
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

  // ===== 批量操作 =====

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

  // ===== 事务支持 =====

  async withTransaction<T>(fn: (repo: IScheduleTaskRepository) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const txRepo = new PrismaScheduleTaskRepository(tx as PrismaClient);
      return fn(txRepo);
    });
  }
}

