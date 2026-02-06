import type { PrismaClient } from '../generated/prisma/client';
import type Database from 'better-sqlite3';

import type {
  IGoalRepository,
  IGoalFolderRepository,
  IGoalStatisticsRepository,
  IFocusModeRepository,
  IFocusSessionRepository,
  IWeightSnapshotRepository,
} from '@dailyuse/domain-server/goal';

import {
  ArchiveGoal,
  GoalApplicationService,
  GoalKeyResultApplicationService,
  SearchGoals
} from '@dailyuse/application-server';

import { GoalRepositoryFactory } from './di/repository-factory';

type BetterSQLiteDB = Database.Database;

/**
 * Goal Module
 * 
 * DI Container for Goal domain.
 * Supports both Prisma (API) and SQLite (Desktop) data sources.
 * 
 * Usage:
 * ```typescript
 * // API (Prisma)
 * const goalModule = new GoalModule('prisma', prismaClient);
 * 
 * // Desktop (SQLite)
 * const goalModule = new GoalModule('sqlite', sqliteDb);
 * ```
 */
export class GoalModule {
  // ============ Repositories (Public for testing) ============
  public readonly goalRepository: IGoalRepository;
  public readonly goalFolderRepository: IGoalFolderRepository;
  public readonly goalStatisticsRepository: IGoalStatisticsRepository;
  public readonly focusModeRepository: IFocusModeRepository;
  public readonly focusSessionRepository: IFocusSessionRepository;
  public readonly weightSnapshotRepository: IWeightSnapshotRepository;

  // ============ Application Services (Public - injected into routes) ============
  public readonly archiveGoal: ArchiveGoal;
  public readonly goalApplicationService: GoalApplicationService;
  public readonly goalKeyResultApplicationService: GoalKeyResultApplicationService;
  public readonly searchGoalsService: SearchGoals;

  constructor(dataSourceType: 'prisma' | 'sqlite', dbConnection: PrismaClient | BetterSQLiteDB) {
    // ============ Step 1: Initialize Repositories using Factory ============
    const repositories = GoalRepositoryFactory.create(dataSourceType, dbConnection);
    
    this.goalRepository = repositories.goalRepository;
    this.goalFolderRepository = repositories.goalFolderRepository;
    this.goalStatisticsRepository = repositories.goalStatisticsRepository;
    this.focusModeRepository = repositories.focusModeRepository;
    this.focusSessionRepository = repositories.focusSessionRepository;
    this.weightSnapshotRepository = repositories.weightSnapshotRepository;

    // ============ Step 2: Initialize Application Services (Pure DI) ============
    this.archiveGoal = new ArchiveGoal(this.goalRepository);
    this.goalApplicationService = new GoalApplicationService(this.goalRepository);
    this.goalKeyResultApplicationService = new GoalKeyResultApplicationService(this.goalRepository);
    this.searchGoalsService = new SearchGoals(this.goalRepository);
  }
}
