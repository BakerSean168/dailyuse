/**
 * Infrastructure Module - Desktop Main Process
 * 
 * Handles the initialization of Dependency Injection containers and database connections.
 * This module serves as the bootstrap for the backend infrastructure within the desktop app.
 *
 * @module modules/infrastructure
 */

import {
  GoalContainer,
  TaskContainer,
  ScheduleContainer,
  ReminderContainer,
  AIContainer,
} from '@dailyuse/infrastructure-server';
import { createLogger } from '@dailyuse/utils';
import { app } from 'electron';
import * as path from 'path';

const logger = createLogger('Infrastructure');

/**
 * Initializes all Dependency Injection Containers.
 *
 * Sets up the database connection and registers all SQLite repositories.
 * 
 * @returns {Promise<void>} Resolves when initialization is complete.
 */
export async function initializeContainers(): Promise<void> {
  logger.info('Initializing DI containers...');

  try {
    // 导入SQLite Repository实现
    const {
      SqliteGoalRepository,
      SqliteGoalFolderRepository,
      SqliteGoalStatisticsRepository,
      SqliteTaskTemplateRepository,
      SqliteTaskInstanceRepository,
      SqliteTaskStatisticsRepository,
      SqliteScheduleTaskRepository,
      SqliteScheduleStatisticsRepository,
      SqliteReminderTemplateRepository,
      SqliteReminderGroupRepository,
      SqliteReminderStatisticsRepository,
      SqliteAIConversationRepository,
      SqliteAIGenerationTaskRepository,
      SqliteAIUsageQuotaRepository,
      SqliteAIProviderConfigRepository,
    } = await import('../../di/sqlite-adapters');

    // ========== Goal Container ==========
    GoalContainer.getInstance()
      .registerGoalRepository(new SqliteGoalRepository())
      .registerGoalFolderRepository(new SqliteGoalFolderRepository())
      .registerStatisticsRepository(new SqliteGoalStatisticsRepository());
    
    logger.info('✅ Goal Container initialized');

    // ========== Task Container ==========
    TaskContainer.getInstance()
      .registerTemplateRepository(new SqliteTaskTemplateRepository())
      .registerInstanceRepository(new SqliteTaskInstanceRepository())
      .registerStatisticsRepository(new SqliteTaskStatisticsRepository());
    
    logger.info('✅ Task Container initialized');

    // ========== Schedule Container ==========
    ScheduleContainer.getInstance()
      .registerScheduleTaskRepository(new SqliteScheduleTaskRepository())
      .registerStatisticsRepository(new SqliteScheduleStatisticsRepository());
    
    logger.info('✅ Schedule Container initialized');

    // ========== Reminder Container ==========
    ReminderContainer.getInstance()
      .registerTemplateRepository(new SqliteReminderTemplateRepository())
      .registerGroupRepository(new SqliteReminderGroupRepository())
      .registerStatisticsRepository(new SqliteReminderStatisticsRepository());
    
    logger.info('✅ Reminder Container initialized');

    // ========== AI Container ==========
    AIContainer.getInstance()
      .registerConversationRepository(new SqliteAIConversationRepository())
      .registerGenerationTaskRepository(new SqliteAIGenerationTaskRepository())
      .registerUsageQuotaRepository(new SqliteAIUsageQuotaRepository())
      .registerProviderConfigRepository(new SqliteAIProviderConfigRepository());
    
    logger.info('✅ AI Container initialized');

    logger.info('🎉 All DI containers initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize containers:', error);
    throw error;
  }
}

/**
 * Closes all container resources, specifically database connections.
 *
 * Should be called during application shutdown to ensure a graceful exit.
 *
 * @returns {Promise<void>} Resolves when all containers are closed.
 */
export async function closeContainers(): Promise<void> {
  logger.info('Closing containers...');

  try {

    await (GoalContainer as any).close?.();

    await (TaskContainer as any).close?.();

    await (ScheduleContainer as any).close?.();

    await (ReminderContainer as any).close?.();

    await (AIContainer as any).close?.();
    
    logger.info('All containers closed');
  } catch (error) {
    logger.error('Error closing containers', error);
  }
}
