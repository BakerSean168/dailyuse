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

/**
 * Registers all initialization tasks from various modules.
 * This function should be called from the main process entry point (`main.ts`) during application startup.
 * It imports initialization hooks from infrastructure and feature modules and executes them.
 */
export function registerAllInitializationTasks(): void {
  console.log('[Initialization] Registering all application initialization tasks...');

  // Infrastructure initialization (database, DI, IPC)

  // Module-specific initialization tasks
  // These calls register tasks with the InitializationManager but do not execute them immediately.
  // Execution happens when InitializationManager.executePhase() is called.


  console.log('[Initialization] All initialization tasks registered');
}
