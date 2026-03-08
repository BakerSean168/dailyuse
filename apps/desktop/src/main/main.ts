/**
 * @file Electron Main Process Entry Point
 * @description
 *
 * Clean entry point — delegates all module wiring to the ElectronBootstrapper.
 * Each business module registers itself (repos, services, IPC handlers) via its
 * own `electron-entry` Composition Root, mirroring the API-side pattern.
 *
 * Responsibilities of this file:
 *   1. Initialize the SQLite database
 *   2. Bootstrap all business modules via ElectronBootstrapper
 *   3. Start ancillary services (memory cleanup, dev tools)
 *   4. Hand off to the lifecycle manager (window creation, shutdown)
 */

import { initializeDatabase, startMemoryCleanup } from './database';
import { initMemoryMonitorForDev, registerCacheIpcHandlers } from './utils';
import { registerAppLifecycleHandlers } from './lifecycle';
import { initializeEventListeners } from './events/initialize-event-listeners';
import { ElectronBootstrapper } from './bootstrap';
import { registerDashboardIpcHandler } from './ipc/dashboard-handler';

// ── Module Electron Entry Points ─────────────────────────────────────
import { GoalElectronModule } from '@dailyuse/goal/electron-entry';
import { TaskElectronModule } from '@dailyuse/task/electron-entry';
import { ScheduleElectronModule } from '@dailyuse/schedule/electron-entry';
import { ReminderElectronModule } from '@dailyuse/reminder/electron-entry';
import { NotificationElectronModule } from '@dailyuse/notification/electron-entry';
import { SettingElectronModule } from '@dailyuse/setting/electron-entry';
import { AIElectronModule } from '@dailyuse/ai/electron-entry';
import { RepositoryElectronModule } from '@dailyuse/repository/electron-entry';
import { createEditorElectronModule } from '@dailyuse/editor/electron-entry';
import { AccountElectronModule } from '@dailyuse/account/electron-entry';
import { DesktopAuthElectronModule } from './modules/authentication/desktop-auth.electron-module';
import { GovernanceElectronModule } from '@dailyuse/governance/electron-entry';

/** Kept as module-level for graceful shutdown access. */
let bootstrapper: ElectronBootstrapper | null = null;

/**
 * Application initialisation sequence.
 */
async function initializeApp(): Promise<void> {
  const startTime = performance.now();
  console.log('[App] Initializing...');

  // 1. Database
  const db = initializeDatabase();
  console.log('[App] Database initialized');

  // 2. Bootstrap business modules
  bootstrapper = new ElectronBootstrapper(db);
  await bootstrapper
    // Core services
    .register(AccountElectronModule)
    .register(DesktopAuthElectronModule)
    .register(SettingElectronModule)
    .register(NotificationElectronModule)
    // Feature modules
    .register(GoalElectronModule)
    .register(TaskElectronModule)
    .register(ScheduleElectronModule)
    .register(ReminderElectronModule)
    .register(AIElectronModule)
    .register(GovernanceElectronModule)
    // Repository must precede Editor (cross-module dep)
    .register(RepositoryElectronModule)
    .register(
      createEditorElectronModule({
        // TODO: provide a real IRepositoryContentPort once FileSystemStorageAdapter is implemented
        contentPort: {
          getContent: async () => ({ resourceId: '', name: '', content: null }),
          saveContent: async () => {},
        },
      }),
    )
    .init();
  console.log('[App] All modules bootstrapped');

  // 3. Cross-module event listeners
  await initializeEventListeners();
  console.log('[App] Event listeners initialized');

  // 4. Ancillary
  startMemoryCleanup();
  initMemoryMonitorForDev();
  registerCacheIpcHandlers();
  registerDashboardIpcHandler();

  const initTime = performance.now() - startTime;
  console.log(`[App] Initialization complete in ${initTime.toFixed(2)}ms`);

  if (process.env.BENCHMARK_MODE === 'true') {
    console.log('[BENCHMARK] READY');
  }
}

// ── Lifecycle ────────────────────────────────────────────────────────
registerAppLifecycleHandlers(initializeApp);

/**
 * Expose bootstrapper for graceful shutdown from lifecycle manager.
 */
export function getBootstrapper(): ElectronBootstrapper | null {
  return bootstrapper;
}
