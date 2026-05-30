/**
 * Electron Main Process Entry Point
 *
 * Two-phase startup for multi-profile architecture:
 *
 * Phase A — Shell Runtime (runs at app start):
 *   - Shared paths, ProfileRegistry, DesktopProfileRuntimeManager
 *   - Login window and shared auth IPC
 *
 * Phase B — Profile Runtime (runs after successful login):
 *   - Per-profile PowerSync database
 *   - Per-profile ElectronBootstrapper with all business modules
 *   - Main window and schedule runtime
 */

import './runtime-init';
import type { IElectronModuleContext } from '@dailyuse/contracts/electron';
import { initMemoryMonitorForDev, registerCacheIpcHandlers } from './utils';
import { registerAppLifecycleHandlers } from './lifecycle';
import { initializeEventListeners } from './events/initialize-event-listeners';
import { ElectronBootstrapper } from './bootstrap';
import { registerDashboardIpcHandler } from './ipc/dashboard-handler';

// ── Module Electron Entry Points ─────────────────────────────────────
import { GoalElectronModule } from '@dailyuse/goal/electron-entry';
import { TaskElectronModule } from '@dailyuse/task/electron-entry';
import { createScheduleElectronModule } from '@dailyuse/schedule/electron-entry';
import { ReminderElectronModule } from '@dailyuse/reminder/electron-entry';
import { NotificationElectronModule } from '@dailyuse/notification/electron-entry';
import { SettingElectronModule } from '@dailyuse/setting/electron-entry';
import { createAIElectronModule } from '@dailyuse/ai/electron-entry';
import { createRepositoryElectronModule } from '@dailyuse/repository/electron-entry';
import { createRepositoryPowerSyncModule, FsStorageAdapter } from '@dailyuse/repository/infrastructure-server';
import { createEditorElectronModule } from '@dailyuse/editor/electron-entry';
import { AccountElectronModule } from '@dailyuse/account/electron-entry';
import { registerDesktopAuthShellHandlers } from './modules/authentication/desktop-auth-shell';
import { GovernanceElectronModule } from '@dailyuse/governance/electron-entry';
import { unwrapOrThrowError } from '@dailyuse/contracts/result';
import { DesktopAnalyticsReadAdapter } from './modules/ai/desktop-analytics-read.adapter';
import { DesktopAutomationToolExecutorAdapter } from './modules/ai/desktop-automation-tool-executor.adapter';
import { DesktopKnowledgeNotePersistenceAdapter } from './modules/ai/desktop-knowledge-note-persistence.adapter';
import { DesktopKnowledgeSourceAdapter } from './modules/ai/desktop-knowledge-source.adapter';
import { configureDesktopShellIdentity } from './utils/app-icon';
import { createLogger } from '@dailyuse/utils/logger';
import { getSharedPathResolver } from './runtime-init';
import { WindowManager } from './lifecycle/window-manager';
import type { ProfilePathResolver } from './paths';
import { ProfileRegistry } from './profile/profile-registry';
import { DesktopProfileRuntimeManager } from './profile/desktop-profile-runtime-manager';
import type { PowerSyncDatabase } from '@powersync/node';
import { createDesktopSourceExecutor } from './modules/schedule/source-executors';
import { createDesktopRepositorySearchAdapter } from './modules/repository/desktop-repository-search.adapter';
import { DesktopMainRuntime } from './desktop-main-runtime';

configureDesktopShellIdentity();

const logger = createLogger('DesktopMain');
let mainRuntime: DesktopMainRuntime | null = null;
const windowManager = new WindowManager();

/**
 * Register all business modules on a bootstrapper for the active profile.
 * Called by DesktopProfileRuntimeManager during profile activation.
 */
async function registerBusinessModules(
  bootstrapper: ElectronBootstrapper,
  db: PowerSyncDatabase,
  profilePaths: ProfilePathResolver,
): Promise<void> {
  const startTime = performance.now();

  const repositoryStorageDir = profilePaths.repositoryStorageDir;
  const editorRepositoryModule = createRepositoryPowerSyncModule(db, {
    storagePort: new FsStorageAdapter(repositoryStorageDir),
  });

  const searchAdapter = createDesktopRepositorySearchAdapter(db, repositoryStorageDir);
  const sourceExecutor = createDesktopSourceExecutor(db);

  const AIElectronModule = createAIElectronModule({
    createKnowledgeNotePersistence: (context: IElectronModuleContext) =>
      new DesktopKnowledgeNotePersistenceAdapter(context.db, repositoryStorageDir),
    createKnowledgeSourcePort: (context: IElectronModuleContext) =>
      new DesktopKnowledgeSourceAdapter(context.db, repositoryStorageDir),
    createAnalyticsReadPort: () => new DesktopAnalyticsReadAdapter(),
    createAutomationToolExecutor: (context: IElectronModuleContext) =>
      new DesktopAutomationToolExecutorAdapter(context.db, repositoryStorageDir),
  });

  const repositoryElectronModule = createRepositoryElectronModule({
    storageBaseDir: repositoryStorageDir,
  });

  const scheduleElectronModule = createScheduleElectronModule({
    shouldScheduleTask: (task) => {
      const authService = mainRuntime?.profileRuntimeManager.getCurrentAuthService();
      const identityId = authService?.getCurrentIdentityId() ?? null;
      return identityId !== null && String(task.identityId) === identityId;
    },
    sourceExecutor,
  });

  await bootstrapper
    // Core services
    .register(AccountElectronModule)
    .register(SettingElectronModule)
    .register(NotificationElectronModule)
    // Feature modules
    .register(GoalElectronModule)
    .register(TaskElectronModule)
    .register(scheduleElectronModule)
    .register(ReminderElectronModule)
    .register(AIElectronModule)
    .register(GovernanceElectronModule)
    // Repository must precede Editor (cross-module dep)
    .register(repositoryElectronModule)
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
            unwrapOrThrowError(result);
          },
        },
        searchPort: {
          search: async (request) => {
            if (!request.workspaceId) {
              return { results: [], total: 0 };
            }

            const repositorySearch = await searchAdapter.search(
              request.workspaceId,
              request.query,
            );

            return {
              results: repositorySearch.results
                .slice(request.offset ?? 0, (request.offset ?? 0) + (request.limit ?? 20))
                .map((item) => ({
                  resourceId: item.resourceId,
                  resourcePath: item.resourcePath,
                  resourceName: item.resourceName,
                  snippet: item.matches[0]?.lineContent ?? '',
                  score: item.matchCount,
                  highlights: item.matches.map((match) => ({
                    line: match.lineNumber,
                    text: match.lineContent,
                  })),
                })),
              total: repositorySearch.totalResults,
            };
          },
        },
      }),
    );

  const initTime = performance.now() - startTime;
  logger.info(`Business modules registered in ${initTime.toFixed(2)}ms`);
}

// ═══════════════════════════════════════════════════════════════════════
// Shell Runtime Initialization
// ═══════════════════════════════════════════════════════════════════════

/**
 * Initialize the shell runtime — shared infrastructure that runs before
 * any profile is selected. This is what runs at app startup.
 */
async function initializeShellRuntime(): Promise<void> {
  const startTime = performance.now();
  console.log('[Shell] Initializing shell runtime...');

  const sharedResolver = getSharedPathResolver();
  console.log(`[Shell] Root path: ${sharedResolver.rootDir}`);

  // Initialize ProfileRegistry
  const profileRegistry = new ProfileRegistry(sharedResolver);
  await profileRegistry.load();
  console.log('[Shell] ProfileRegistry initialized');

  // Initialize shared auth infrastructure
  const { RememberedAccountsService, NetworkStateManager, TokenManager } = await import(
    './modules/authentication/infrastructure'
  );
  const tokenManager = new TokenManager();
  const rememberedAccountsService = new RememberedAccountsService();
  rememberedAccountsService.setFilePath(sharedResolver.rememberedAccountsPath);
  const networkStateManager = new NetworkStateManager();

  // Initialize DesktopProfileRuntimeManager with injected dependencies
  const profileRuntimeManager = new DesktopProfileRuntimeManager(
    sharedResolver,
    profileRegistry,
    tokenManager,
    rememberedAccountsService,
    networkStateManager,
    windowManager,
  );

  // Assemble the explicit runtime owner
  mainRuntime = new DesktopMainRuntime(windowManager, profileRuntimeManager);

  // Set up module registration — this closure captures the business module
  // creation logic and provides it to the runtime manager for profile activation
  profileRuntimeManager.setModuleRegistration(async (bootstrapper, db, profilePaths) => {
    await registerBusinessModules(bootstrapper, db, profilePaths);
  });

  registerDesktopAuthShellHandlers(profileRuntimeManager, {
    rememberedAccountsService,
    networkStateManager,
    windowManager,
  });

  // SessionManager.sharedAuthDir will be set during profile activation
  // (DesktopProfileRuntimeManager.prepareProfile + activatePreparedProfile), not during shell init,
  // because SessionManager is created fresh per profile.

  // Cross-module event listeners
  await initializeEventListeners();
  console.log('[Shell] Event listeners initialized');

  // Ancillary
  initMemoryMonitorForDev();
  registerCacheIpcHandlers();
  registerDashboardIpcHandler(() => mainRuntime?.authContextProvider ?? null);

  const initTime = performance.now() - startTime;
  console.log(`[Shell] Shell runtime initialized in ${initTime.toFixed(2)}ms`);
}

// ═══════════════════════════════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════════════════════════════

registerAppLifecycleHandlers(initializeShellRuntime, () => mainRuntime, windowManager);

/**
 * Expose bootstrapper for backward compatibility (graceful shutdown from lifecycle manager).
 */
export function getBootstrapper(): ElectronBootstrapper | null {
  return mainRuntime?.getBootstrapper() ?? null;
}
