/**
 * Goal Repository Factory
 * Provides repository implementations for different data sources
 */

import type { PrismaClient } from '@prisma/client';
import type Database from 'better-sqlite3';

// Import ports
import type {
  IGoalRepository,
  IGoalFolderRepository,
  IGoalStatisticsRepository,
  IFocusModeRepository,
  IFocusSessionRepository,
  IWeightSnapshotRepository,
} from '../ports';

// Import Prisma adapters
import {
  GoalPrismaRepository,
  GoalFolderPrismaRepository,
  GoalStatisticsPrismaRepository,
  FocusModePrismaRepository,
  FocusSessionPrismaRepository,
  WeightSnapshotPrismaRepository,
} from '../adapters/prisma';

// Import SQLite adapters
import {
  SqliteGoalRepository,
  SqliteGoalFolderRepository,
  SqliteGoalStatisticsRepository,
  SqliteFocusModeRepository,
  SqliteFocusSessionRepository,
  SqliteWeightSnapshotRepository,
} from '../adapters/sqlite';

/**
 * Repository container interface
 */
export interface IGoalRepositoryContainer {
  goalRepository: IGoalRepository;
  goalFolderRepository: IGoalFolderRepository;
  goalStatisticsRepository: IGoalStatisticsRepository;
  focusModeRepository: IFocusModeRepository;
  focusSessionRepository: IFocusSessionRepository;
  weightSnapshotRepository: IWeightSnapshotRepository;
}

/**
 * Goal Repository Factory
 */
export class GoalRepositoryFactory {
  /**
   * Create repositories using Prisma (for API/PostgreSQL)
   */
  static createPrismaRepositories(prisma: PrismaClient): IGoalRepositoryContainer {
    return {
      goalRepository: new GoalPrismaRepository(prisma),
      goalFolderRepository: new GoalFolderPrismaRepository(prisma),
      goalStatisticsRepository: new GoalStatisticsPrismaRepository(prisma),
      focusModeRepository: new FocusModePrismaRepository(prisma),
      focusSessionRepository: new FocusSessionPrismaRepository(prisma),
      weightSnapshotRepository: new WeightSnapshotPrismaRepository(prisma),
    };
  }

  /**
   * Create repositories using SQLite (for Desktop/better-sqlite3)
   */
  static createSqliteRepositories(db: Database.Database): IGoalRepositoryContainer {
    return {
      goalRepository: new SqliteGoalRepository(db),
      goalFolderRepository: new SqliteGoalFolderRepository(db),
      goalStatisticsRepository: new SqliteGoalStatisticsRepository(db),
      focusModeRepository: new SqliteFocusModeRepository(db),
      focusSessionRepository: new SqliteFocusSessionRepository(db),
      weightSnapshotRepository: new SqliteWeightSnapshotRepository(db),
    };
  }

  /**
   * Create repositories based on data source type
   */
  static create(
    dataSource: 'prisma' | 'sqlite',
    client: PrismaClient | Database.Database,
  ): IGoalRepositoryContainer {
    if (dataSource === 'prisma') {
      return this.createPrismaRepositories(client as PrismaClient);
    } else {
      return this.createSqliteRepositories(client as Database.Database);
    }
  }
}
