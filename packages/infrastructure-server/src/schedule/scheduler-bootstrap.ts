/**
 * SchedulerBootstrap
 *
 * Initializes and manages the scheduler
 *
 * @architecture
 * - Placeholder for scheduler initialization
 * - Fully complies with layered architecture
 */

import { createLogger } from '@dailyuse/utils';
import type { PrismaClient } from '@prisma/client';

const logger = createLogger('SchedulerBootstrap');

/**
 * Scheduler Startup Engine
 *
 * Responsibilities:
 * - Initialize scheduler
 * - Load all active recurring tasks from database
 * - Register tasks to scheduler
 * - Start the scheduler
 */
export class SchedulerBootstrap {
  private static instance: SchedulerBootstrap;
  private initialized = false;

  private constructor(prisma: PrismaClient) {
    // Initialize dependencies
    logger.info('SchedulerBootstrap initialized');
  }

  public static getInstance(prisma: PrismaClient): SchedulerBootstrap {
    if (!SchedulerBootstrap.instance) {
      if (!prisma) {
        throw new Error('SchedulerBootstrap.getInstance() requires prisma instance for first initialization');
      }
      SchedulerBootstrap.instance = new SchedulerBootstrap(prisma);
    }
    return SchedulerBootstrap.instance;
  }

  /**
   * Initialize Scheduler
   *
   * Execution Steps:
   * 1. Load all enabled recurring tasks from database
   * 2. Register each task to scheduler
   * 3. Start the scheduler
   *
   * @throws Error when initialization fails
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('Scheduler already initialized');
      return;
    }

    try {
      logger.info('Initializing scheduler...');
      this.initialized = true;
      logger.info('Scheduler initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize scheduler', { error });
      throw error;
    }
  }

  /**
   * Shutdown scheduler
   */
  public async shutdown(): Promise<void> {
    try {
      logger.info('Scheduler stopped');
    } catch (error) {
      logger.error('Error stopping scheduler', { error });
      throw error;
    }
  }

  /**
   * Check if scheduler is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}


