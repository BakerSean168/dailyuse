import type { PrismaClient } from '../../generated/prisma/client';
import type Database from 'better-sqlite3';
import type {
  ITaskInstanceRepository,
  ITaskDependencyRepository,
  ITaskStatisticsRepository,
} from '@/domain-server';
import { TaskInstancePrismaRepository } from '../adapters/prisma/task-instance-prisma.repository';
import { TaskDependencyPrismaRepository } from '../adapters/prisma/task-dependency-prisma.repository';
import { TaskStatisticsPrismaRepository } from '../adapters/prisma/task-statistics-prisma.repository';
import { SqliteTaskInstanceRepository } from '../adapters/sqlite/task-instance-sqlite.repository';
import { SqliteTaskDependencyRepository } from '../adapters/sqlite/task-dependency-sqlite.repository';
import { SqliteTaskStatisticsRepository } from '../adapters/sqlite/task-statistics-sqlite.repository';

/**
 * Task Repository Factory
 *
 * Creates repository instances based on data source type
 * Supports: Prisma (API/Server), SQLite (Desktop)
 *
 * 用法:
 * const instanceRepo = TaskRepositoryFactory.createTaskInstanceRepository(dataSourceType, dbConnection);
 */
export class TaskRepositoryFactory {
  /**
   * Create TaskInstanceRepository
   */
  static createTaskInstanceRepository(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | Database,
  ): ITaskInstanceRepository {
    if (dataSourceType === 'prisma') {
      return new TaskInstancePrismaRepository(dbConnection as PrismaClient);
    } else if (dataSourceType === 'sqlite') {
      return new SqliteTaskInstanceRepository(dbConnection as Database);
    }
    throw new Error(`Unknown data source type: ${dataSourceType}`);
  }

  /**
   * Create TaskDependencyRepository
   */
  static createTaskDependencyRepository(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | Database,
  ): ITaskDependencyRepository {
    if (dataSourceType === 'prisma') {
      return new TaskDependencyPrismaRepository(dbConnection as PrismaClient);
    } else if (dataSourceType === 'sqlite') {
      return new SqliteTaskDependencyRepository(dbConnection as Database);
    }
    throw new Error(`Unknown data source type: ${dataSourceType}`);
  }

  /**
   * Create TaskStatisticsRepository
   */
  static createTaskStatisticsRepository(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | Database,
  ): ITaskStatisticsRepository {
    if (dataSourceType === 'prisma') {
      return new TaskStatisticsPrismaRepository(dbConnection as PrismaClient);
    } else if (dataSourceType === 'sqlite') {
      return new SqliteTaskStatisticsRepository(dbConnection as Database);
    }
    throw new Error(`Unknown data source type: ${dataSourceType}`);
  }

  /**
   * Create all Task repositories at once (convenience method)
   */
  static createAllRepositories(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | Database,
  ) {
    return {
      taskInstanceRepository: this.createTaskInstanceRepository(dataSourceType, dbConnection),
      taskDependencyRepository: this.createTaskDependencyRepository(dataSourceType, dbConnection),
      taskStatisticsRepository: this.createTaskStatisticsRepository(dataSourceType, dbConnection),
    };
  }
}
