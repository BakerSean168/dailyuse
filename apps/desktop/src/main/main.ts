/**
 * @file Electron Main Process Entry Point
 * @description
 *
 * Clean entry point — delegates all module wiring to the ElectronBootstrapper.
 * Each business module registers itself (repos, services, IPC handlers) via its
 * own `electron-entry` Composition Root, mirroring the API-side pattern.
 *
 * Responsibilities of this file:
 *   1. Initialize the PowerSync-backed business database runtime
 *   2. Bootstrap all business modules via ElectronBootstrapper
 *   3. Start ancillary services (dev tools)
 *   4. Hand off to the lifecycle manager (window creation, shutdown)
 */

import path from 'node:path';
import { app } from 'electron';
import { openPowerSyncLocalOnly } from './database/powersync';
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
import { createAIElectronModule } from '@dailyuse/ai/electron-entry';
import { RepositoryElectronModule } from '@dailyuse/repository/electron-entry';
import { createRepositoryPowerSyncModule, FsStorageAdapter } from '@dailyuse/repository';
import { createEditorElectronModule } from '@dailyuse/editor/electron-entry';
import { AccountElectronModule } from '@dailyuse/account/electron-entry';
import { DesktopAuthElectronModule } from './modules/authentication/desktop-auth.electron-module';
import { GovernanceElectronModule } from '@dailyuse/governance/electron-entry';
import { DesktopKnowledgeNotePersistenceAdapter } from './modules/ai/desktop-knowledge-note-persistence.adapter';

const AIElectronModule = createAIElectronModule({
  createKnowledgeNotePersistence: (context: {
    db: Parameters<typeof createRepositoryPowerSyncModule>[0];
  }) => new DesktopKnowledgeNotePersistenceAdapter(context.db),
});

/** Kept as module-level for graceful shutdown access. */
let bootstrapper: ElectronBootstrapper | null = null;

/**
 * Application initialisation sequence.
 */
async function initializeApp(): Promise<void> {
  const startTime = performance.now();
  console.log('[App] Initializing...');

  // 1. PowerSync-backed business database runtime
  const db = await openPowerSyncLocalOnly();
  console.log('[App] PowerSync business database initialized');

  // 2. Bootstrap business modules
  const repositoryStorageDir = path.join(app.getPath('userData'), 'repository-storage');
  const editorRepositoryModule = createRepositoryPowerSyncModule(db, {
    storagePort: new FsStorageAdapter(repositoryStorageDir),
  });

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
        contentPort: {
          getContent: async (resourceId) => {
            const result = await editorRepositoryModule.api.getResource(resourceId);
            if (!result.ok || !result.data) {
              return { resourceId, name: '', content: null };
            }

            const resource = result.data as { id: string; name: string; content: string | null };
            return {
              resourceId: resource.id,
              name: resource.name,
              content: resource.content,
            };
          },
          saveContent: async ({ resourceId, content }) => {
            const result = await editorRepositoryModule.api.updateResource(resourceId, { content });
            if (!result.ok) {
              throw new Error(result.error.message || 'Failed to persist editor content');
            }
          },
        },
      }),
    )
    .init();
  console.log('[App] All modules bootstrapped');

  // 3. Cross-module event listeners
  await initializeEventListeners();
  console.log('[App] Event listeners initialized');

  // 4. Ancillary
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
