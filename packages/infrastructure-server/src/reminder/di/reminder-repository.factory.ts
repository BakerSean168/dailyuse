/**
 * Reminder Repository Factory
 * Provides repository implementations for different data sources
 * 
 * Note: Reminder has an architectural mismatch:
 * - Prisma: Single ReminderPrismaRepository
 * - SQLite: Multiple repositories (Group, Template, Response, Statistics)
 * 
 * This factory provides just the main repository for now
 */

import type { PrismaClient } from '@prisma/client';
import type Database from 'better-sqlite3';

import { ReminderPrismaRepository } from '../adapters/prisma';
import {
  SqliteReminderGroupRepository,
  SqliteReminderTemplateRepository,
  SqliteReminderResponseRepository,
  SqliteReminderStatisticsRepository,
} from '../adapters/sqlite';

type BetterSQLiteDB = Database.Database;

/**
 * Reminder Repository Factory
 */
export class ReminderRepositoryFactory {
  /**
   * Create repositories using Prisma (for API/PostgreSQL)
   */
  static createPrismaRepositories(prisma: PrismaClient) {
    return {
      reminderRepository: new ReminderPrismaRepository(prisma),
    };
  }

  /**
   * Create repositories using SQLite (for Desktop/better-sqlite3)
   * 
   * Note: Returns multiple repositories due to architectural differences
   */
  static createSqliteRepositories(db: BetterSQLiteDB) {
    return {
      reminderGroupRepository: new SqliteReminderGroupRepository(db),
      reminderTemplateRepository: new SqliteReminderTemplateRepository(db),
      reminderResponseRepository: new SqliteReminderResponseRepository(db),
      reminderStatisticsRepository: new SqliteReminderStatisticsRepository(db),
    };
  }

  /**
   * Create repositories based on data source type
   */
  static create(
    dataSource: 'prisma' | 'sqlite',
    client: PrismaClient | BetterSQLiteDB,
  ): ReturnType<typeof ReminderRepositoryFactory.createPrismaRepositories> {
    if (dataSource === 'prisma') {
      return this.createPrismaRepositories(client as PrismaClient) as any;
    } else {
      return this.createSqliteRepositories(client as BetterSQLiteDB) as any;
    }
  }
}

