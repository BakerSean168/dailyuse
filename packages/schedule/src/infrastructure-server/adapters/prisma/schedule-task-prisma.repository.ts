/**
 * Prisma Schedule Task Repository
 *
 * Responsibilities:
 * - Implements IScheduleTaskRepository interface
 * - Uses mapper for data mapping
 * - Manages ScheduleExecution child entity persistence
 * - Publishes domain events after successful persistence
 *
 * @implements {IScheduleTaskRepository}
 */

import type {
  PrismaClient,
  ScheduleTask as PrismaScheduleTask,
  ScheduleExecution as PrismaScheduleExecution,
  Prisma,
} from '@dailyuse/database';
import type { IScheduleTaskRepository } from '../../../domain-server/repositories/i-schedule-task-repository';
import { ScheduleTask } from '../../../domain-server/aggregates/schedule-task';
import type { SourceModule } from '@dailyuse/contracts/schedule';
import { ScheduleTaskStatus } from '@dailyuse/contracts/schedule';
import { AggregateRepositoryBase, createEventBusAdapter } from '@dailyuse/patterns';
import { eventBus } from '@dailyuse/utils';
import {
  PrismaScheduleTaskMapper,
  type PrismaScheduleTaskWithExecutions,
} from './mappers/prisma-schedule-task-mapper';
import { PrismaScheduleExecutionMapper } from './mappers/prisma-schedule-execution-mapper';

const eventBusAdapter = createEventBusAdapter(eventBus);

/**
 * Query options for ScheduleTask.
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
 *
 * Prisma-based DDD Repository implementation for the ScheduleTask aggregate.
 */
export class ScheduleTaskPrismaRepository
  extends AggregateRepositoryBase<ScheduleTask>
  implements IScheduleTaskRepository
{
  constructor(private prisma: PrismaClient) {
    super(eventBusAdapter);
  }

  // ===== Mapping =====

  /** Converts a Prisma record to a ScheduleTask aggregate root. */
  private toDomain(data: PrismaScheduleTaskWithExecutions): ScheduleTask {
    return PrismaScheduleTaskMapper.toDomain(data);
  }

  /** Converts a ScheduleTask aggregate to Prisma write data. */
  private toPrisma(task: ScheduleTask) {
    return PrismaScheduleTaskMapper.toPersistence(task);
  }

  // ===== Core CRUD =====

  /**
   * Protected persistence method — called by base class before event publishing.
   * Persists the ScheduleTask root and all ScheduleExecution child entities
   * atomically within a single transaction.
   */
  protected async persist(task: ScheduleTask): Promise<void> {
    const data = this.toPrisma(task);

    await this.prisma.$transaction(async (tx) => {
      await tx.scheduleTask.upsert({
        where: { id: data.id },
        create: data,
        update: data,
      });

      // Save execution records
      const executions = task.executions;
      if (executions && executions.length > 0) {
        for (const execution of executions) {
          const execData = PrismaScheduleExecutionMapper.toCreateInput(execution);
          await tx.scheduleExecution.upsert({
            where: { id: execData.id },
            create: {
              ...execData,
              identityId: task.identityId,
            },
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
    });
  }

  async findById(id: string): Promise<ScheduleTask | null> {
    const data = await this.prisma.scheduleTask.findUnique({
      where: { id },
      include: {
        executions: {
          orderBy: { createdAt: 'desc' },
          take: 10, // Load the latest 10 execution records
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

  // ===== Query Methods =====

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
    // Find active tasks with nextRunAt <= beforeTime for execution
    const tasks = await this.prisma.scheduleTask.findMany({
      where: {
        enabled: true,
        status: ScheduleTaskStatus.Active,
        nextRunAt: {
          lte: beforeTime, // Use <= for the SQL query
        },
      },
      orderBy: {
        nextRunAt: 'asc', // Earliest due tasks first
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

  // ===== Batch Operations =====

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

  // ===== Transaction Support =====

  async withTransaction<T>(fn: (repo: IScheduleTaskRepository) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const txRepo = new ScheduleTaskPrismaRepository(tx as PrismaClient);
      return fn(txRepo);
    });
  }
}
