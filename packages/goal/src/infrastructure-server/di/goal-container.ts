import type {
  IGoalRepository,
  IGoalFolderRepository,
  IFocusSessionRepository,
  IGoalStatisticsRepository,
  IFocusModeRepository,
  IWeightSnapshotRepository,
  IKeyResultRepository,
} from '@/domain-server';
import { PrismaGoalRepository } from '../repositories/PrismaGoalRepository';
import { PrismaFocusSessionRepository } from '../repositories/PrismaFocusSessionRepository';
import { PrismaGoalStatisticsRepository } from '../repositories/PrismaGoalStatisticsRepository';
import { PrismaGoalFolderRepository } from '../repositories/PrismaGoalFolderRepository';
import { PrismaFocusModeRepository } from '../repositories/PrismaFocusModeRepository';
import { DataSourceManager } from '../../shared/config/data-source-manager';
import { prisma } from '../../shared/config/prisma';

/**
 * Goal Module DI Container
 * Manages repository instances for Goal domain
 *
 * Supports both Prisma (API) and SQLite (Desktop) data sources
 * Uses factory pattern to create appropriate implementations
 */
export class GoalContainer {
  private static instance: GoalContainer;
  private goalRepository?: IGoalRepository;
  private goalFolderRepository?: IGoalFolderRepository;
  private focusSessionRepository?: IFocusSessionRepository;
  private focusModeRepository?: IFocusModeRepository;
  private goalStatisticsRepository?: IGoalStatisticsRepository;

  private constructor() {}

  static getInstance(): GoalContainer {
    if (!GoalContainer.instance) {
      GoalContainer.instance = new GoalContainer();
    }
    return GoalContainer.instance;
  }

  /**
   * Get goal repository instance (lazy load with caching)
   */
  getGoalRepository(): IGoalRepository {
    if (!this.goalRepository) {
      this.goalRepository = new PrismaGoalRepository(prisma);
    }
    return this.goalRepository;
  }

  /**
   * Set goal repository (for testing)
   */
  setGoalRepository(repository: IGoalRepository): void {
    this.goalRepository = repository;
  }

  /**
   * Get goal folder repository (lazy load with caching)
   */
  getGoalFolderRepository(): IGoalFolderRepository {
    if (!this.goalFolderRepository) {
      this.goalFolderRepository = new PrismaGoalFolderRepository(prisma);
    }
    return this.goalFolderRepository;
  }

  /**
   * Set goal folder repository (for testing)
   */
  setGoalFolderRepository(repository: IGoalFolderRepository): void {
    this.goalFolderRepository = repository;
  }

  /**
   * Get focus session repository (lazy load with caching)
   */
  getFocusSessionRepository(): IFocusSessionRepository {
    if (!this.focusSessionRepository) {
      this.focusSessionRepository = new PrismaFocusSessionRepository(prisma);
    }
    return this.focusSessionRepository;
  }

  /**
   * Set focus session repository (for testing)
   */
  setFocusSessionRepository(repository: IFocusSessionRepository): void {
    this.focusSessionRepository = repository;
  }

  /**
   * Get focus mode repository (lazy load with caching)
   */
  getFocusModeRepository(): IFocusModeRepository {
    if (!this.focusModeRepository) {
      this.focusModeRepository = new PrismaFocusModeRepository(prisma);
    }
    return this.focusModeRepository;
  }

  /**
   * Set focus mode repository (for testing)
   */
  setFocusModeRepository(repository: IFocusModeRepository): void {
    this.focusModeRepository = repository;
  }

  /**
   * Get goal statistics repository (lazy load with caching)
   */
  getGoalStatisticsRepository(): IGoalStatisticsRepository {
    if (!this.goalStatisticsRepository) {
      this.goalStatisticsRepository = new PrismaGoalStatisticsRepository(prisma);
    }
    return this.goalStatisticsRepository;
  }

  /**
   * Set goal statistics repository (for testing)
   */
  setGoalStatisticsRepository(repository: IGoalStatisticsRepository): void {
    this.goalStatisticsRepository = repository;
  }

  /**
   * Reset container (for testing)
   */
  reset(): void {
    this.goalRepository = undefined;
    this.goalFolderRepository = undefined;
    this.focusSessionRepository = undefined;
    this.focusModeRepository = undefined;
    this.goalStatisticsRepository = undefined;
  }
}

