/**
 * Shared Initialization Module
 *
 * Centralizes the registration of initialization tasks across the Desktop application.
 * This module acts as the orchestrator, ensuring all feature modules register their
 * startup logic with the central `InitializationManager`.
 *
 * @module shared/initialization
 */

export { registerInfrastructureInitializationTasks } from './infraInitialization';

import { registerInfrastructureInitializationTasks } from './infraInitialization';
import { registerAIInitializationTasks } from '../../main/modules/ai/initialization';
import { registerTaskInitializationTasks } from '../../main/modules/task/initialization';
import { registerGoalInitializationTasks } from '../../main/modules/goal/initialization';
import { registerScheduleInitializationTasks } from '../../main/modules/schedule/initialization';
import { registerNotificationInitializationTasks } from '../../main/modules/notification/initialization';
import { registerRepositoryInitializationTasks } from '../../main/modules/repository/initialization';
import { registerDashboardInitializationTasks } from '../../main/modules/dashboard/initialization';
import { registerAccountInitializationTasks } from '../../main/modules/account/initialization';
import { registerSettingInitializationTasks } from '../../main/modules/setting/initialization';

/**
 * Registers all initialization tasks from various modules.
 * This function should be called from the main process entry point (`main.ts`) during application startup.
 * It imports initialization hooks from infrastructure and feature modules and executes them.
 */
export function registerAllInitializationTasks(): void {
  console.log('[Initialization] Registering all application initialization tasks...');

  // Infrastructure initialization (database, DI, IPC)
  registerInfrastructureInitializationTasks();

  // Module-specific initialization tasks
  // These calls register tasks with the InitializationManager but do not execute them immediately.
  // Execution happens when InitializationManager.executePhase() is called.

  registerAIInitializationTasks();
  registerTaskInitializationTasks();
  registerGoalInitializationTasks();
  registerScheduleInitializationTasks();
  registerNotificationInitializationTasks();
  registerRepositoryInitializationTasks();
  registerDashboardInitializationTasks();
  registerAccountInitializationTasks();
  registerSettingInitializationTasks();

  console.log('[Initialization] All initialization tasks registered');
}
