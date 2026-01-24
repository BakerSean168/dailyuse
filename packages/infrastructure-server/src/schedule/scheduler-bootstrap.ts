/**
 * SchedulerBootstrap
 *
 * Initializes and manages the scheduler
 * Uses scheduler-server package and BreeScheduler
 *
 * Replaces the existing ScheduleBootstrap and CronJobManager
 *
 * @architecture
 * - Depends on @dailyuse/scheduler-server (new package)
 * - Depends on ScheduleTaskExecutorAdapter (implements TaskHandler)
 * - Removes direct dependency on Infrastructure layer scheduler
 * - Fully complies with layered architecture
 */

import { createLogger } from '@dailyuse/utils';
import { BreeScheduler } from '@dailyuse/scheduler-server';
import type { IScheduler } from '@dailyuse/scheduler-server';
import { ScheduleTaskExecutorAdapter, ScheduleTaskExecutor } from '@dailyuse/application-server';
import { ScheduleTaskPrismaRepository } from './adapters/prisma/schedule-task-prisma.repository';
import type { PrismaClient } from '@prisma/client';
import { ScheduleMonitor } from './monitoring/ScheduleMonitor';

const logger = createLogger('SchedulerBootstrap');

/**
 * Scheduler Startup Engine
 *
 * Responsibilities:
 * - Initialize BreeScheduler (or other scheduling engines)
 * - Load all active recurring tasks from database
 * - Register tasks to scheduler
 * - Start the scheduler
 */
export class SchedulerBootstrap {
  private static instance: SchedulerBootstrap;
  private scheduler: IScheduler;
  private repository: ScheduleTaskPrismaRepository;
  private handler: ScheduleTaskExecutorAdapter;
  private initialized = false;

  private constructor(prisma: PrismaClient) {
    // Initialize dependencies
    this.repository = new ScheduleTaskPrismaRepository(prisma);
    const monitor = ScheduleMonitor.getInstance();
    const executor = new ScheduleTaskExecutor(this.repository, monitor);
    this.handler = new ScheduleTaskExecutorAdapter(executor);

    // Use BreeScheduler (recommended)
    this.scheduler = new BreeScheduler({
      root: false, // Disable file system Worker
    });
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
   * 2. Register each task to BreeScheduler
   * 3. Start the scheduler
   *
   * @throws Error when initialization fails
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn(' Scheduler already initialized');
      return;
    }

    try {
      logger.info('Initializing scheduler...');

      // Step 1: Load and register all tasks
      await this.loadAndRegisterTasks();

      // Step 2: Start the scheduler
      await this.scheduler.start();

      this.initialized = true;
      logger.info(' Scheduler initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize scheduler', { error });
      throw error;
    }
  }

  /**
   * Load recurring tasks from database and register them to scheduler
   */
  private async loadAndRegisterTasks(): Promise<void> {
    try {
      const tasks = await this.repository.findEnabled();
      logger.info('Loading recurring tasks', { count: tasks.length });

      let registered = 0;

      for (const task of tasks) {
        if (task.status !== 'active' || !task.enabled) {
          continue;
        }

        try {
          await this.scheduler.register(task.uuid, task.schedule.cronExpression, this.handler);
          registered++;
        } catch (error) {
          logger.error(`Failed to register task ${task.uuid}`, { error });
        }
      }

      logger.info(`Successfully registered ${registered}/${tasks.length} tasks`);
    } catch (error) {
      logger.error('Failed to load tasks', { error });
      throw error;
    }
  }

  /**
   * Shutdown scheduler
   */
  public async shutdown(): Promise<void> {
    try {
      await this.scheduler.stop();
      logger.info(' Scheduler stopped');
    } catch (error) {
      logger.error('Error stopping scheduler', { error });
      throw error;
    }
  }

  /**
   * Get scheduler instance
   */
  public getScheduler(): IScheduler {
    return this.scheduler;
  }

  /**
   * Check if scheduler is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}


