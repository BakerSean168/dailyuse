/**
 * Module Registry
 *
 * Centralizes the registration and initialization of all application modules.
 * Manages the dependency order and lifecycle of infrastructure, core services, and feature modules.
 *
 * @module modules
 */

import { InitializationManager, InitializationPhase, createLogger } from '@dailyuse/utils';

// Infrastructure
import { initializeContainers, closeContainers } from './infrastructure';

// Core Services
import { registerAccountModule } from './account';
import { registerAuthenticationModule } from './authentication';
import { registerSettingModule } from './setting';
import { registerNotificationModule } from './notification';

// Feature Modules
import { registerGoalModule } from './goal';
import { registerTaskModule } from './task';
import { registerScheduleModule } from './schedule';
import { registerReminderModule } from './reminder';
import { registerAIModule } from './ai';
import { registerDashboardModule } from './dashboard';
import { registerRepositoryModule } from './repository';
import { registerEditorModule } from './editor';

const logger = createLogger('ModuleRegistry');

/**
 * Registers all application modules with the InitializationManager.
 * 
 * Modules are grouped by initialization phase and priority:
 * 1. **INFRASTRUCTURE** (Priority 10): Database connections, DI containers.
 * 2. **CORE_SERVICES** (Priority 40-50): Account, Settings, Authentication, Notifications.
 * 3. **FEATURE_MODULES** (Priority 50-160): Goals, Tasks, Schedule, AI, Dashboard, etc.
 */
export function registerAllModules(): void {
  const manager = InitializationManager.getInstance();

  // ===== Phase 1: INFRASTRUCTURE =====
  manager.registerTask({
    name: 'infrastructure',
    phase: InitializationPhase.APP_STARTUP,
    priority: 10, // Highest priority
    initialize: async () => {
      logger.info('Initializing infrastructure...');
      await initializeContainers();
      logger.info('Infrastructure initialized');
    },
    cleanup: async () => {
      logger.info('Cleaning up infrastructure...');
      await closeContainers();
      logger.info('Infrastructure cleaned up');
    },
  });

  // ===== Phase 2: CORE_SERVICES =====
  registerAccountModule();
  registerAuthenticationModule();
  registerSettingModule();
  registerNotificationModule();

  // ===== Phase 3: FEATURE_MODULES =====
  registerGoalModule();
  registerTaskModule();
  registerScheduleModule();
  registerReminderModule();
  registerAIModule();
  registerDashboardModule();
  registerRepositoryModule();
  registerEditorModule();

  logger.info('All modules registered');
}

/**
 * Executes the initialization sequence for all registered modules.
 *
 * @returns {Promise<Object>} An object containing the success status, any failed modules, and the total duration.
 */
export async function initializeAllModules(): Promise<{
  ok: boolean;
  failedModules: string[];
  duration: number;
}> {
  const startTime = Date.now();
  
  try {
    const manager = InitializationManager.getInstance();
    
    // Execute APP_STARTUP phase (contains all our modules)
    await manager.executePhase(InitializationPhase.APP_STARTUP);
    
    const duration = Date.now() - startTime;
    logger.info('All modules initialized successfully', { duration: `${duration}ms` });
    
    return {
      ok: true,
      failedModules: [],
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Module initialization failed', error);
    
    return {
      ok: false,
      failedModules: ['initialization-error'],
      duration,
    };
  }
}

/**
 * Performs a graceful shutdown of all modules.
 * Executes cleanup tasks in reverse order of initialization priority.
 *
 * @returns {Promise<void>} Resolves when all modules have been shut down.
 */
export async function shutdownAllModules(): Promise<void> {
  logger.info('Shutting down all modules...');
  
  const manager = InitializationManager.getInstance();
  
  // Cleanup APP_STARTUP phase (in reverse priority order)
  await manager.cleanupPhase(InitializationPhase.APP_STARTUP);
  
  logger.info('All modules shut down');
}
