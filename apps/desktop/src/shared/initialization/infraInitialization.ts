import { InitializationManager, InitializationPhase } from '@dailyuse/utils';

/**
 * Registers infrastructure initialization tasks with the InitializationManager.
 *
 * This function orchestrates the startup sequence for the core infrastructure layer:
 * 1. **Database**: Establishes the PowerSync-backed business database runtime.
 * 2. **DI Container**: Configures dependency injection for services and repositories.
 * 3. **IPC System**: Registers all Electron IPC handlers.
 *
 * Each task declares its priority and dependencies to ensure a deterministic and safe startup order.
 */
export function registerInfrastructureInitializationTasks(): void {
  const manager = InitializationManager.getInstance();

  /**
   * Task 1: Database Initialization
   *
   * Initializes the PowerSync-backed desktop business database runtime.
   *
   * Priority: 5 (Very high, no dependencies)
   * Phase: APP_STARTUP (Critical path)
   */
  manager.registerTask({
    name: 'database-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 5,
    dependencies: [],
    initialize: async () => {
      console.log('[Infrastructure] Shell runtime no longer initializes a business database at startup');
      const startTime = performance.now();

      try {
        const duration = performance.now() - startTime;

        console.log(
          `[Infrastructure] Database initialization deferred to profile runtime (${duration.toFixed(2)}ms)`,
        );
      } catch (error) {
        console.error('[Infrastructure] Database initialization failed:', error);
        throw new Error(
          `Database initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
    cleanup: async () => {
      console.log('[Infrastructure] Cleaning up database connection...');
      try {
        // Note: closeDatabase is typically handled by the app lifecycle manager
        // This acts as a hook if specific module-level cleanup is needed
      } catch (error) {
        console.error('[Infrastructure] Database cleanup failed:', error);
      }
    },
  });

  /**
   * Task 2: DI Container Configuration
   *
   * Sets up the dependency injection container with:
   * - Repository instances (linked to the DB)
   * - Service instances
   * - Factory functions
   *
   * Dependencies: 'database-initialization' (Repositories require a DB connection)
   * Priority: 10 (High, runs after database)
   * Phase: APP_STARTUP
   */
  manager.registerTask({
    name: 'di-container-configuration',
    phase: InitializationPhase.APP_STARTUP,
    priority: 10,
    dependencies: ['database-initialization'],
    initialize: async () => {
      console.log('[Infrastructure] Configuring DI container...');
      const startTime = performance.now();

      try {
        // ElectronBootstrapper now owns main-process composition directly.
        const duration = performance.now() - startTime;

        console.log(
          `[Infrastructure] DI container bootstrap is now handled by ElectronBootstrapper (${duration.toFixed(2)}ms)`,
        );
      } catch (error) {
        console.error('[Infrastructure] DI container configuration failed:', error);
        throw new Error(
          `DI configuration failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
    cleanup: async () => {
      console.log('[Infrastructure] Cleaning up DI container...');
      // DI containers usually manage their own cleanup via singletons
    },
  });

  /**
   * Task 3: IPC System Initialization
   *
   * Registers all IPC handlers for various modules (AI, Task, Goal, Schedule, etc.).
   *
   * Dependencies: 'di-container-configuration' (Handlers depend on injected services)
   * Priority: 15 (Medium-high, runs after DI)
   * Phase: APP_STARTUP
   */
  manager.registerTask({
    name: 'ipc-system-initialization',
    phase: InitializationPhase.APP_STARTUP,
    priority: 15,
    dependencies: ['di-container-configuration'],
    initialize: async () => {
      console.log('[Infrastructure] Initializing IPC system...');
      const startTime = performance.now();

      try {
        // IPC registration is now handled during ElectronBootstrapper module registration.

        const duration = performance.now() - startTime;

        console.log(
          `[Infrastructure] IPC bootstrap is now handled by ElectronBootstrapper (${duration.toFixed(2)}ms)`,
        );
      } catch (error) {
        console.error('[Infrastructure] IPC system initialization failed:', error);
        throw new Error(
          `IPC initialization failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
    cleanup: async () => {
      console.log('[Infrastructure] Cleaning up IPC system...');
      // IPC handlers are typically persistent until app exit
    },
  });
}
