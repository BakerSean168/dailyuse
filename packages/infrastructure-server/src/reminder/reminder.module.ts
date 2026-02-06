import type { PrismaClient } from '../generated/prisma/client';
import type Database from 'better-sqlite3';

import { ReminderRepositoryFactory } from './di';

type BetterSQLiteDB = Database.Database;

/**
 * Reminder Module
 * 
 * WARNING: This module has architectural inconsistency:
 * - Prisma uses single ReminderPrismaRepository
 * - SQLite uses multiple repositories (Group, Template, Response, Statistics)
 * 
 * For now, we only expose the main repositories. Full alignment needed.
 */
export class ReminderModule {
  public readonly reminderRepository: any;
  // SQLite uses: reminderGroupRepository, reminderTemplateRepository, etc.

  constructor(
    dataSourceType: 'prisma' | 'sqlite',
    dbConnection: PrismaClient | BetterSQLiteDB,
  ) {
    // 1. Initialize Repositories using Factory
    const repositories = ReminderRepositoryFactory.create(dataSourceType, dbConnection);
    
    if (dataSourceType === 'prisma') {
      this.reminderRepository = repositories.reminderRepository;
    } else {
      // SQLite returns multiple repositories
      // TODO: Refactor Reminder module to have unified interface
      // For now, expose all of them
      Object.assign(this, repositories);
    }
  }
}
