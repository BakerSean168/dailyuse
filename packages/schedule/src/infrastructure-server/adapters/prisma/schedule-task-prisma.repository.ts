/**
 * Prisma Schedule Task Repository
 * ScheduleTask 閼辨艾鎮庨弽?Prisma Repository鐎圭偟骞?
 *
 * 閼卞矁鐭楅敍?
 * - 鐎圭偟骞?IScheduleTaskRepository 閹恒儱褰?
 * - 娴ｈ法鏁?toPersistenceDTO/fromPersistenceDTO 鏉╂稖顢戦弫鐗堝祦鏉烆剚�?
 * - 婢跺嫮鎮?ScheduleExecution 鐎涙劕鐤勬担鎾舵畱缁狙嗕粓閹垮秳�?
 * - 閹绘劒绶电€瑰本鏆ｉ惃鍕叀鐠囥垹鎷伴幐浣风畽閸栨牕濮涢�?
 *
 * @implements {IScheduleTaskRepository}
 */

import type { PrismaClient, ScheduleTask as PrismaScheduleTask, ScheduleExecution as PrismaScheduleExecution, Prisma } from '@dailyuse/database';
import type { IScheduleTaskRepository } from '../../../domain-server/repositories/IScheduleTaskRepository';
import { ScheduleTask } from '../../../domain-server/aggregates/schedule-task';
import type { SourceModule } from '@dailyuse/contracts/schedule';
import { ScheduleTaskStatus } from '@dailyuse/contracts/schedule';
import { AggregateRepositoryBase, createEventBusAdapter } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';
import { PrismaScheduleTaskMapper, type PrismaScheduleTaskWithExecutions } from './mappers/prisma-schedule-task-mapper';
import { PrismaScheduleExecutionMapper } from './mappers/prisma-schedule-execution-mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

/**
 * ScheduleTask 閺屻儴顕楅柅澶愩�?
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
export class ScheduleTaskPrismaRepository
  extends AggregateRepositoryBase<ScheduleTask>
  implements IScheduleTaskRepository
{
  constructor(private prisma: PrismaClient) {
    super(eventBusAdapter);
  }

  // ===== Mapping =====

  /**
   * Prisma �?ScheduleTask aggregate root
   */
  private toDomain(data: PrismaScheduleTaskWithExecutions): ScheduleTask {
    return PrismaScheduleTaskMapper.toDomain(data);
  }

  /**
   * ScheduleTask aggregate �?Prisma write data
   */
  private toPrisma(task: ScheduleTask) {
    return PrismaScheduleTaskMapper.toPersistence(task);
  }

  // ===== 閸╃儤婀?CRUD =====

  /**
   * Protected persistence method - called by base class before event publishing
   */
  protected async persist(task: ScheduleTask): Promise<void> {
    const data = this.toPrisma(task);

    await this.prisma.scheduleTask.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });

    // Save execution records
    const executions = task.executions;
    if (executions && executions.length > 0) {
      for (const execution of executions) {
        const execData = PrismaScheduleExecutionMapper.toCreateInput(execution);
        await this.prisma.scheduleExecution.upsert({
          where: { id: execData.id },
          create: execData,
          update: {
            status: execData.status,
            duration: execData.duration ?? null,
            result: execData.result ?? null,
            error: execData.error ?? null,
            retryCount: execData.retryCount ?? 0,
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
          take: 10, // 閺堚偓鏉?10 閺夆剝澧界悰宀冾唶�?
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

  // ===== 閺屻儴顕楅弬瑙勭�?=====

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
    // �?娴兼ê瀵茬€瑰本鍨氶敍浣哄箛閸?nextRunAt 閺勵垳瀚粩瀣摟濞堢绱濋崣顖欎簰閻╁瓨甯撮悽?SQL 閺屻儴顕?
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        enabled: true,
        status: ScheduleTaskStatus.Active,
        nextRunAt: {
          lte: beforeTime, // �?閻╁瓨甯?SQL 閺屻儴顕楅敍?
        },
      },
      orderBy: {
        nextRunAt: 'asc', // 閹稿澧界悰灞炬闂傚瓨甯撴�?
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
    const where: Prisma.ScheduleTaskWhereInput = {};

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
    const where: Prisma.ScheduleTaskWhereInput = {};

    if (options.identityId) where.identityId = options.identityId;
    if (options.sourceModule) where.sourceModule = options.sourceModule;
    if (options.sourceEntityId) where.sourceEntityId = options.sourceEntityId;
    if (options.status) where.status = options.status;
    if (options.isEnabled !== undefined) where.enabled = options.isEnabled;

    return this.prisma.scheduleTask.count({ where });
  }

  // ===== 閹靛綊鍣洪幙宥勭�?=====

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

  // ===== 娴滃濮熼弨顖涘�?=====

  async withTransaction<T>(fn: (repo: IScheduleTaskRepository) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const txRepo = new ScheduleTaskPrismaRepository(tx as PrismaClient);
      return fn(txRepo);
    });
  }
}


