/**
 * Task Repository Factory
 * 任务仓储工厂
 *
 * 根据数据源类型创建对应的仓储实例
 * 支持: Prisma (API/Server), SQLite (Desktop)
 */

import type { PrismaClient } from '@dailyuse/database';
import type Database from 'better-sqlite3';
import type { ITaskTemplateRepository } from '../../domain-server/repositories/ITaskTemplateRepository';
import type { ITaskInstanceRepository } from '../../domain-server/repositories/ITaskInstanceRepository';
import type { ITaskDependencyRepository } from '../../domain-server/repositories/ITaskDependencyRepository';
import type { ITaskFolderRepository } from '../../domain-server/repositories/ITaskFolderRepository';
import { TaskTemplatePrismaRepository } from '../adapters/prisma/task-template-prisma.repository';
import { TaskInstancePrismaRepository } from '../adapters/prisma/task-instance-prisma.repository';
import { TaskDependencyPrismaRepository } from '../adapters/prisma/task-dependency-prisma.repository';
import { TaskFolderPrismaRepository } from '../adapters/prisma/task-folder-prisma.repository';
import { SqliteTaskTemplateRepository } from '../adapters/sqlite/task-template-sqlite.repository';
import { SqliteTaskInstanceRepository } from '../adapters/sqlite/task-instance-sqlite.repository';
import { SqliteTaskDependencyRepository } from '../adapters/sqlite/task-dependency-sqlite.repository';
import { SqliteTaskFolderRepository } from '../adapters/sqlite/task-folder-sqlite.repository';

type BetterSQLiteDB = Database.Database;

export class TaskRepositoryFactory {
  static createTaskTemplateRepository(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ): ITaskTemplateRepository {
    if (dataSourceType === 'prisma') {
      return new TaskTemplatePrismaRepository(dbConnection as PrismaClient);
    } else if (dataSourceType === 'sqlite') {
      return new SqliteTaskTemplateRepository(dbConnection as BetterSQLiteDB);
    }
    throw new Error(`Unknown data source type: ${dataSourceType}`);
  }

  static createTaskInstanceRepository(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ): ITaskInstanceRepository {
    if (dataSourceType === 'prisma') {
      return new TaskInstancePrismaRepository(dbConnection as PrismaClient);
    } else if (dataSourceType === 'sqlite') {
      return new SqliteTaskInstanceRepository(dbConnection as BetterSQLiteDB);
    }
    throw new Error(`Unknown data source type: ${dataSourceType}`);
  }

  static createTaskDependencyRepository(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ): ITaskDependencyRepository {
    if (dataSourceType === 'prisma') {
      return new TaskDependencyPrismaRepository(dbConnection as PrismaClient);
    } else if (dataSourceType === 'sqlite') {
      return new SqliteTaskDependencyRepository(dbConnection as BetterSQLiteDB);
    }
    throw new Error(`Unknown data source type: ${dataSourceType}`);
  }

  static createTaskFolderRepository(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ): ITaskFolderRepository {
    if (dataSourceType === 'prisma') {
      return new TaskFolderPrismaRepository(dbConnection as PrismaClient);
    } else if (dataSourceType === 'sqlite') {
      return new SqliteTaskFolderRepository(dbConnection as BetterSQLiteDB);
    }
    throw new Error(`Unknown data source type: ${dataSourceType}`);
  }

  /**
   * Create all Task repositories at once (convenience method)
   */
  static createAllRepositories(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ) {
    return {
      taskTemplateRepository: this.createTaskTemplateRepository(dataSourceType, dbConnection),
      taskInstanceRepository: this.createTaskInstanceRepository(dataSourceType, dbConnection),
      taskDependencyRepository: this.createTaskDependencyRepository(dataSourceType, dbConnection),
      taskFolderRepository: this.createTaskFolderRepository(dataSourceType, dbConnection),
    };
  }
}
