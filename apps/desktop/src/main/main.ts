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
import { powerMonitor } from 'electron';
import type { IElectronModuleContext } from '@dailyuse/contracts/electron';
import { initMemoryMonitorForDev, registerCacheIpcHandlers } from './utils';
import { registerAppLifecycleHandlers } from './lifecycle';
import { ElectronBootstrapper } from './bootstrap';
import { registerDashboardIpcHandler } from './ipc/dashboard-handler';

// ── Module Electron Entry Points ─────────────────────────────────────
import { GoalElectronModule } from '@dailyuse/goal/electron';
import { createTaskElectronModule } from '@dailyuse/task/electron';
import { createTaskPowerSyncScheduleExecutionSource } from '@dailyuse/task/schedule-execution';
import { createTaskPowerSyncScheduleProjectionSource } from '@dailyuse/task/schedule-projection';
import {
  createScheduleElectronModule,
  PowerSyncScheduleTaskRepository,
} from '@dailyuse/schedule/electron';
import { createScheduleOrchestrationModule } from '@dailyuse/schedule-orchestration';
import { createGoalPowerSyncScheduleExecutionSource } from '@dailyuse/goal/schedule-execution';
import { createGoalPowerSyncScheduleProjectionSource } from '@dailyuse/goal/schedule-projection';
import { ReminderElectronModule } from '@dailyuse/reminder/electron';
import { createReminderPowerSyncScheduleExecutionSource } from '@dailyuse/reminder/schedule-execution';
import { createReminderPowerSyncScheduleProjectionSource } from '@dailyuse/reminder/schedule-projection';
import {
  NotificationElectronModule,
  createNotificationPowerSyncScheduleNotificationPort,
} from '@dailyuse/notification/electron';
import { SettingElectronModule } from '@dailyuse/setting/electron';
import { createAIElectronModule } from '@dailyuse/ai/electron';
import {
  createRepositoryElectronModule,
  createLocalVaultRuntime,
} from '@dailyuse/repository/electron';
import { AccountElectronModule } from '@dailyuse/account/electron';
import { DataPortabilityElectronModule } from '@dailyuse/data-portability/electron';
import { registerDesktopAuthShellHandlers } from './modules/authentication/desktop-auth-shell';
import { GovernanceElectronModule } from '@dailyuse/governance/electron';
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
import { KnowledgeRepositoryRemoteGateway } from './modules/repository/knowledge-repository-remote.gateway';
import { DesktopKnowledgeRepositoryGitRuntime } from './modules/repository/desktop-knowledge-repository-git.runtime';
import { DesktopKnowledgeRepositoryReconciliationService } from './modules/repository/desktop-knowledge-repository-reconciliation.service';
import { DesktopKnowledgeRepositorySyncService } from './modules/repository/desktop-knowledge-repository-sync.service';
import { DesktopKnowledgeRepositoryAutoSyncScheduler } from './modules/repository/desktop-knowledge-repository-auto-sync.scheduler';
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

  const localVaultRuntime = createLocalVaultRuntime({
    bindingFilePath: profilePaths.localVaultBindingPath,
    writeLedgerFilePath: profilePaths.localVaultWriteLedgerPath,
  });
  const scheduleTaskRepository = new PowerSyncScheduleTaskRepository(db);
  const scheduleOrchestrationModule = createScheduleOrchestrationModule({
    taskProjection: {
      source: createTaskPowerSyncScheduleProjectionSource(db),
      scheduleTaskRepository,
    },
    goalProjection: {
      source: createGoalPowerSyncScheduleProjectionSource(db),
      scheduleTaskRepository,
    },
    reminderProjection: {
      source: createReminderPowerSyncScheduleProjectionSource(db),
      scheduleTaskRepository,
    },
    execution: {
      taskSource: createTaskPowerSyncScheduleExecutionSource(db),
      goalSource: createGoalPowerSyncScheduleExecutionSource(db),
      reminderSource: createReminderPowerSyncScheduleExecutionSource(db),
      notificationPort: createNotificationPowerSyncScheduleNotificationPort(db),
    },
  });
  const taskElectronModule = createTaskElectronModule({
    runtimeContributions: scheduleOrchestrationModule.projectionRuntime,
  });

  const AIElectronModule = createAIElectronModule({
    createKnowledgeNotePersistence: () =>
      new DesktopKnowledgeNotePersistenceAdapter(localVaultRuntime),
    createKnowledgeSourcePort: () => new DesktopKnowledgeSourceAdapter(localVaultRuntime),
    createAnalyticsReadPort: () => new DesktopAnalyticsReadAdapter(),
    createAutomationToolExecutor: (context: IElectronModuleContext) =>
      new DesktopAutomationToolExecutorAdapter(context.db, localVaultRuntime),
  });

  const knowledgeRepositoryRemoteGateway = new KnowledgeRepositoryRemoteGateway({
    getAccessToken: () =>
      mainRuntime?.profileRuntimeManager.getCurrentAuthService()?.getAccessToken() ?? null,
  });
  const knowledgeRepositoryGitRuntime = new DesktopKnowledgeRepositoryGitRuntime();
  const knowledgeRepositoryReconciliationService =
    new DesktopKnowledgeRepositoryReconciliationService({
      localVault: localVaultRuntime,
      remote: knowledgeRepositoryRemoteGateway,
      gitRuntime: knowledgeRepositoryGitRuntime,
    });
  const knowledgeRepositorySyncService = new DesktopKnowledgeRepositorySyncService({
    localVault: localVaultRuntime,
    remote: knowledgeRepositoryRemoteGateway,
    gitRuntime: knowledgeRepositoryGitRuntime,
  });
  const networkStateManager = mainRuntime?.profileRuntimeManager.getNetworkStateManager();
  const knowledgeRepositoryAutoSyncScheduler = new DesktopKnowledgeRepositoryAutoSyncScheduler({
    localVault: localVaultRuntime,
    remote: knowledgeRepositoryRemoteGateway,
    synchronization: knowledgeRepositorySyncService,
    lifecycle: {
      onNetworkOnline(listener) {
        networkStateManager?.on('online', listener);
        return () => networkStateManager?.off('online', listener);
      },
      onSystemResume(listener) {
        let resumeTimer: ReturnType<typeof setTimeout> | null = null;
        const handleResume = () => {
          if (resumeTimer) clearTimeout(resumeTimer);
          resumeTimer = setTimeout(listener, 2_000);
          resumeTimer.unref?.();
        };
        powerMonitor.on('resume', handleResume);
        return () => {
          powerMonitor.off('resume', handleResume);
          if (resumeTimer) clearTimeout(resumeTimer);
        };
      },
    },
    stateFilePath: profilePaths.knowledgeRepositoryAutoSyncStatePath,
  });
  const repositoryElectronModule = createRepositoryElectronModule({
    localVaultPort: localVaultRuntime,
    knowledgeRepositoryConnectionPort: knowledgeRepositoryRemoteGateway,
    knowledgeRepositoryReconciliationPort: knowledgeRepositoryReconciliationService,
    knowledgeRepositorySyncPort: knowledgeRepositorySyncService,
    knowledgeRepositoryAutoSyncScheduler,
  });

  const scheduleElectronModule = createScheduleElectronModule({
    shouldScheduleTask: (task) => {
      const authService = mainRuntime?.profileRuntimeManager.getCurrentAuthService();
      const identityId = authService?.getCurrentIdentityId() ?? null;
      return identityId !== null && String(task.identityId) === identityId;
    },
    sourceExecutor: scheduleOrchestrationModule.sourceExecutor,
  });

  await bootstrapper
    // Core services
    .register(AccountElectronModule)
    .register(SettingElectronModule)
    .register(NotificationElectronModule)
    .register(DataPortabilityElectronModule)
    // Feature modules
    .register(GoalElectronModule)
    .register(taskElectronModule)
    .register(scheduleElectronModule)
    .register(ReminderElectronModule)
    .register(AIElectronModule)
    .register(GovernanceElectronModule)
    .register(repositoryElectronModule);

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
  const { RememberedAccountsService, NetworkStateManager, TokenManager } =
    await import('./modules/authentication/infrastructure');
  const tokenManager = new TokenManager();
  const rememberedAccountsService = new RememberedAccountsService();
  rememberedAccountsService.setFilePath(sharedResolver.rememberedAccountsPath);
  const networkStateManager = new NetworkStateManager({
    enableHealthCheck: true,
    checkInterval: 15_000,
  });

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

  // Cross-module event listeners (task→goal 联动) 现由各模块 electron-entry 在
  // profile 激活时自行挂载（见 GoalElectronModule.register → registerGoalEventListeners），
  // 不再由 shell 层集中初始化。

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
