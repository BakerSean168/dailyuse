/**
 * Schedule Repository Factory
 * Provides repository implementations for different data sources
 */

import type { PrismaClient } from '@dailyuse/database';
import type Database from 'better-sqlite3';

import {
  SchedulePrismaRepository,
  ScheduleExecutionPrismaRepository,
  ScheduleStatisticsPrismaRepository,
  ScheduleTaskPrismaRepository,
} from '../adapters/prisma';

import {
  SqliteScheduleRepository,
  SqliteScheduleExecutionRepository,
  SqliteScheduleStatisticsRepository,
  SqliteScheduleTaskRepository,
} from '../adapters/sqlite';

type BetterSQLiteDB = Database.Database;

/**
 * Schedule Repository Factory
 */
export class ScheduleRepositoryFactory {
  /**
   * Create repositories using Prisma (for API/PostgreSQL)
   */
  static createPrismaRepositories(prisma: PrismaClient) {
    return {
      scheduleRepository: new SchedulePrismaRepository(prisma),
      scheduleExecutionRepository: new ScheduleExecutionPrismaRepository(prisma),
      scheduleStatisticsRepository: new ScheduleStatisticsPrismaRepository(prisma),
      scheduleTaskRepository: new ScheduleTaskPrismaRepository(prisma),
    };
  }

  /**
   * Create repositories using SQLite (for Desktop/better-sqlite3)
   */
  static createSqliteRepositories(db: BetterSQLiteDB) {
    return {
      scheduleRepository: new SqliteScheduleRepository(db),
      scheduleExecutionRepository: new SqliteScheduleExecutionRepository(db),
      scheduleStatisticsRepository: new SqliteScheduleStatisticsRepository(db),
      scheduleTaskRepository: new SqliteScheduleTaskRepository(db),
    };
  }

  /**
   * Create repositories based on data source type
   */
  static create(
    dataSource: 'prisma' | 'sqlite',
    client: PrismaClient | BetterSQLiteDB,
  ): ReturnType<typeof ScheduleRepositoryFactory.createPrismaRepositories> {
    if (dataSource === 'prisma') {
      return this.createPrismaRepositories(client as PrismaClient) as any;
    } else {
      return this.createSqliteRepositories(client as BetterSQLiteDB) as any;
    }
  }
}
