/**
 * Prisma Schedule Task Repository
 * ScheduleTask 閼辨艾鎮庨弽?Prisma Repository鐎圭偟骞?
 *
 * 閼卞矁鐭楅敍?
 * - 鐎圭偟骞?IScheduleTaskRepository 閹恒儱褰?
 * - 娴ｈ法鏁?toPersistenceDTO/fromPersistenceDTO 鏉╂稖顢戦弫鐗堝祦鏉烆剚宕?
 * - 婢跺嫮鎮?ScheduleExecution 鐎涙劕鐤勬担鎾舵畱缁狙嗕粓閹垮秳缍?
 * - 閹绘劒绶电€瑰本鏆ｉ惃鍕叀鐠囥垹鎷伴幐浣风畽閸栨牕濮涢懗?
 *
 * @implements {IScheduleTaskRepository}
 */

import type { PrismaClient } from '@dailyuse/database';
import type { IScheduleTaskRepository } from '../../../domain-server/repositories/IScheduleTaskRepository';
import { ScheduleTask } from '../../../domain-server/aggregates/schedule-task';
import { ScheduleExecution } from '../../../domain-server/entities/schedule-execution';
import { ScheduleTaskStatus } from '@dailyuse/contracts/schedule';
import type { SourceModule, ScheduleTaskPersistenceDTO } from '@dailyuse/contracts/schedule';

/**
 * ScheduleTask 閺屻儴顕楅柅澶愩€?
 */
interface IScheduleTaskQueryOptions {
  identityId?: string;
  sourceModule?: SourceModule;
  sourceEntityId?: string;
  status?: ScheduleTaskStatus;
  isEnabled?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * ScheduleTaskRepository
 * 鐎瑰本鏆ｉ惃?DDD Repository鐎圭偟骞囬敍灞炬￥娑撳瓨妞傞柅鍌炲帳娴狅絿鐖?
 */
export class ScheduleTaskPrismaRepository implements IScheduleTaskRepository {
  constructor(private prisma: PrismaClient) {}

  // ===== 閺佺増宓佹潪顒佸床閺傝纭?=====

  /**
   * 娴?Prisma 濡€崇€锋潪顒佸床娑?ScheduleTask 閼辨艾鎮庨弽?
   * 娴ｈ法鏁ら懕姘値閺嶅湱娈?fromPersistenceDTO 閺傝纭?
   */
  private toDomain(data: any): ScheduleTask {
    // 閺嬪嫬缂?PersistenceDTO閿涘牊澧嶉張澶婄摟濞堢敻鍏橀弰顖涘楠炲啿瀵查惃鍕剁礆
    const persistenceDTO: ScheduleTaskPersistenceDTO = {
      id: data.id,
      identityId: data.identityId,
      name: data.name,
      description: data.description,
      sourceModule: data.sourceModule,
      sourceEntityId: data.sourceEntityId,
      status: data.status,
      enabled: data.enabled,
      // ScheduleConfig 閹典礁閽╅崠鏍х摟濞?
      cronExpression: data.cronExpression,
      timezone: data.timezone,
      startDate: data.startDate ?? null,
      endDate: data.endDate ?? null,
      maxExecutions: data.maxExecutions,
      // ExecutionInfo 閹典礁閽╅崠鏍х摟濞?
      nextRunAt: data.nextRunAt ?? null,
      lastRunAt: data.lastRunAt ?? null,
      executionCount: data.executionCount,
      lastExecutionStatus: data.lastExecutionStatus,
      lastExecutionDuration: data.lastExecutionDuration,
      consecutiveFailures: data.consecutiveFailures,
      // RetryPolicy 閹典礁閽╅崠鏍х摟濞?
      maxRetries: data.maxRetries,
      initialDelayMs: data.initialDelayMs,
      maxDelayMs: data.maxDelayMs,
      backoffMultiplier: data.backoffMultiplier,
      retryableStatuses: data.retryableStatuses,
      // TaskMetadata 閹典礁閽╅崠鏍х摟濞?
      payload: data.payload,
      tags: data.tags,
      priority: data.priority,
      timeout: data.timeout,
      // 閺冨爼妫块幋?
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      version: data.version ?? 1,
      deletedAt: data.deletedAt ?? null,
    };

    // 娴ｈ法鏁ら懕姘値閺嶅湱娈?fromPersistenceDTO 閺傝纭禖reate鐎圭偘绶?
    const task = ScheduleTask.fromPersistenceDTO(persistenceDTO);

    // 閹垹顦查幍褑顢慠ecord鐎涙劕鐤勬担?
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
   * 娴?ScheduleTask 閼辨艾鎮庨弽纭呮祮閹诡澀璐?Prisma 閹镐椒绠欓崠鏍ㄦ殶閹?
   * 娴ｈ法鏁ら懕姘値閺嶅湱娈?toPersistenceDTO 閺傝纭?
   */
  private toPrisma(task: ScheduleTask): any {
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
      // ScheduleConfig 閹典礁閽╅崠鏍х摟濞?
      cronExpression: dto.cronExpression,
      timezone: dto.timezone,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      maxExecutions: dto.maxExecutions,
      // ExecutionInfo 閹典礁閽╅崠鏍х摟濞?
      nextRunAt: dto.nextRunAt ? new Date(dto.nextRunAt) : null,
      lastRunAt: dto.lastRunAt ? new Date(dto.lastRunAt) : null,
      executionCount: dto.executionCount,
      lastExecutionStatus: dto.lastExecutionStatus,
      lastExecutionDuration: dto.lastExecutionDuration,
      consecutiveFailures: dto.consecutiveFailures,
      // RetryPolicy 閹典礁閽╅崠鏍х摟濞?
      maxRetries: dto.maxRetries ?? 3,
      initialDelayMs: dto.initialDelayMs ?? 1000,
      maxDelayMs: dto.maxDelayMs ?? 30000,
      backoffMultiplier: dto.backoffMultiplier ?? 2,
      retryableStatuses: dto.retryableStatuses ?? '[]',
      // TaskMetadata 閹典礁閽╅崠鏍х摟濞?
      payload: typeof dto.payload === 'string' ? dto.payload : JSON.stringify(dto.payload),
      tags: dto.tags,
      priority: dto.priority,
      timeout: dto.timeout,
      // 閺冨爼妫块幋?
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
    };
  }

  // ===== 閸╃儤婀?CRUD =====

  async save(task: ScheduleTask): Promise<void> {
    const data = this.toPrisma(task);

    await this.prisma.scheduleTask.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });

    // Save閹笛嗩攽Record閿涘牆顩ч弸婊勬箒閿?
    const executions = task.executions;
    if (executions && executions.length > 0) {
      for (const execution of executions) {
        const execDto = execution.toPersistenceDTO();
        await this.prisma.scheduleExecution.upsert({
          where: { id: execDto.id },
          create: {
            id: execDto.id,
            taskId: execDto.taskId,
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

  async findById(id: string): Promise<ScheduleTask | null> {
    const data = await this.prisma.scheduleTask.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10, // 閺堚偓鏉?10 閺夆剝澧界悰宀冾唶瑜?
        },
      },
    });

    return data ? this.toDomain(data) : null;
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.scheduleTask.delete({
      where: { id },
    });
  }

  // ===== 閺屻儴顕楅弬瑙勭《 =====

  async findByIdentityId(identityId: string): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: { identityId },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.toDomain(task));
  }

  async findBySourceModule(module: SourceModule, identityId?: string): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        sourceModule: module,
        ...(identityId && { identityId }),
      },
      include: {
        executions: {
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
    identityId?: string,
  ): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        sourceModule: module,
        sourceEntityId: entityId,
        ...(identityId && { identityId }),
      },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.toDomain(task));
  }

  async findByStatus(status: ScheduleTaskStatus, identityId?: string): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        status: status,
        ...(identityId && { identityId }),
      },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.toDomain(task));
  }

  async findEnabled(identityId?: string): Promise<ScheduleTask[]> {
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        enabled: true,
        ...(identityId && { identityId }),
      },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.toDomain(task));
  }

  async findDueTasksForExecution(beforeTime: Date, limit?: number): Promise<ScheduleTask[]> {
    // 閴?娴兼ê瀵茬€瑰本鍨氶敍浣哄箛閸?nextRunAt 閺勵垳瀚粩瀣摟濞堢绱濋崣顖欎簰閻╁瓨甯撮悽?SQL 閺屻儴顕?
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        enabled: true,
        status: ScheduleTaskStatus.Active,
        nextRunAt: {
          lte: beforeTime, // 鐚?閻╁瓨甯?SQL 閺屻儴顕楅敍?
        },
      },
      orderBy: {
        nextRunAt: 'asc', // 閹稿澧界悰灞炬闂傚瓨甯撴惔?
      },
      take: limit,
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return tasks.map((task) => this.toDomain(task));
  }

  async query(options: IScheduleTaskQueryOptions): Promise<ScheduleTask[]> {
    const where: any = {};

    if (options.identityId) where.identityId = options.identityId;
    if (options.sourceModule) where.sourceModule = options.sourceModule;
    if (options.sourceEntityId) where.sourceEntityId = options.sourceEntityId;
    if (options.status) where.status = options.status;
    if (options.isEnabled !== undefined) where.enabled = options.isEnabled;

    const tasks = await this.prisma.scheduleTask.findMany({
      where,
      include: {
        executions: {
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

    if (options.identityId) where.identityId = options.identityId;
    if (options.sourceModule) where.sourceModule = options.sourceModule;
    if (options.sourceEntityId) where.sourceEntityId = options.sourceEntityId;
    if (options.status) where.status = options.status;
    if (options.isEnabled !== undefined) where.enabled = options.isEnabled;

    return this.prisma.scheduleTask.count({ where });
  }

  // ===== 閹靛綊鍣洪幙宥勭稊 =====

  async saveBatch(tasks: ScheduleTask[]): Promise<void> {
    for (const task of tasks) {
      await this.save(task);
    }
  }

  async deleteBatch(ids: string[]): Promise<void> {
    await this.prisma.scheduleTask.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });
  }

  // ===== 娴滃濮熼弨顖涘瘮 =====

  async withTransaction<T>(fn: (repo: IScheduleTaskRepository) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const txRepo = new ScheduleTaskPrismaRepository(tx as PrismaClient);
      return fn(txRepo);
    });
  }
}


