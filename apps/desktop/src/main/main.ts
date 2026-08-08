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
import type { IElectronModuleContext } from '@memoflow/contracts/electron';
import { initMemoryMonitorForDev, registerCacheIpcHandlers } from './utils';
import { registerAppLifecycleHandlers } from './lifecycle';
import { ElectronBootstrapper } from './bootstrap';
import { registerDashboardIpcHandler } from './ipc/dashboard-handler';

// ── Module Electron Entry Points ─────────────────────────────────────
import { GoalElectronModule } from '@memoflow/goal/electron';
import { createGoalTaskProgressPowerSyncHandler } from '@memoflow/goal';
import { createTaskElectronModule } from '@memoflow/task/electron';
import { createTaskPowerSyncScheduleExecutionSource } from '@memoflow/task/schedule-execution';
import { createTaskPowerSyncScheduleProjectionSource } from '@memoflow/task/schedule-projection';
import {
  createScheduleElectronModule,
  PowerSyncScheduleTaskRepository,
} from '@memoflow/schedule/electron';
import { createScheduleOrchestrationModule } from '@memoflow/schedule-orchestration';
import { createGoalPowerSyncScheduleExecutionSource } from '@memoflow/goal/schedule-execution';
import { createGoalPowerSyncScheduleProjectionSource } from '@memoflow/goal/schedule-projection';
import { ReminderElectronModule } from '@memoflow/reminder/electron';
import { createReminderPowerSyncScheduleExecutionSource } from '@memoflow/reminder/schedule-execution';
import { createReminderPowerSyncScheduleProjectionSource } from '@memoflow/reminder/schedule-projection';
import {
  NotificationElectronModule,
  createNotificationPowerSyncScheduleNotificationPort,
} from '@memoflow/notification/electron';
import { SettingElectronModule } from '@memoflow/setting/electron';
import { createAIElectronModule } from '@memoflow/ai/electron';
import {
  createRepositoryElectronModule,
  createLocalVaultRuntime,
} from '@memoflow/repository/electron';
import { createAccountElectronModule } from '@memoflow/account/electron';
import { DataPortabilityElectronModule } from '@memoflow/data-portability/electron';
import { GovernanceElectronModule } from '@memoflow/governance/electron';
import { DesktopAnalyticsReadAdapter } from './modules/ai/desktop-analytics-read.adapter';
import { DesktopAutomationToolExecutorAdapter } from './modules/ai/desktop-automation-tool-executor.adapter';
import { DesktopKnowledgeNotePersistenceAdapter } from './modules/ai/desktop-knowledge-note-persistence.adapter';
import { DesktopKnowledgeSourceAdapter } from './modules/ai/desktop-knowledge-source.adapter';
import { configureDesktopShellIdentity } from './utils/app-icon';
import { getApiBaseUrl } from './utils/api-config';
import { createLogger } from '@memoflow/utils/logger';
import { createRuntimeOwnership } from '@memoflow/contracts/primitives';
import { getSharedPathResolver } from './runtime-init';
import { WindowManager } from './lifecycle/window-manager';
import type { ProfilePathResolver } from './paths';
import { ProfileRegistry } from './profile/profile-registry';
import { DesktopProfileRuntimeManager } from './profile/desktop-profile-runtime-manager';
import { registerProfileAccessIpc } from './profile/profile-access-ipc';
import { registerCloudAuthIpc } from './profile/cloud-auth-ipc';
import { CloudSessionStore } from './profile/cloud-session-store';
import { DesktopCloudConnectionManager } from './profile/desktop-cloud-connection-manager';
import { DesktopCloudConnectionService } from './profile/desktop-cloud-connection-service';
import { DeviceAuthCoordinator } from './profile/device-auth-coordinator';
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
  getCloudAccessToken: () => Promise<string | null>,
  closeCurrentCloudConnection: () => Promise<void>,
): Promise<void> {
  const startTime = performance.now();

  // R0-1：runtime ownership —— 明确"哪个宿主在运行、当前进程是谁"。
  // Desktop 是本地 scheduler 宿主（schedule.runtime 的内存队列），
  // 与 cloud API 分开记录，供双宿主对账。
  const ownership = createRuntimeOwnership('desktop-local', undefined, () => new Date());
  logger.info('[runtime-ownership] Desktop host ownership', ownership);

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
    goalProgressHandler: createGoalTaskProgressPowerSyncHandler(db),
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
    getAccessToken: getCloudAccessToken,
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
  const knowledgeRepositoryAutoSyncScheduler = new DesktopKnowledgeRepositoryAutoSyncScheduler({
    localVault: localVaultRuntime,
    remote: knowledgeRepositoryRemoteGateway,
    synchronization: knowledgeRepositorySyncService,
    lifecycle: {
      onNetworkOnline(listener) {
        void listener;
        return () => undefined;
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
      const identityId = mainRuntime?.profileRuntimeManager.getCurrentIdentityId() ?? null;
      return identityId !== null && String(task.identityId) === identityId;
    },
    sourceExecutor: scheduleOrchestrationModule.sourceExecutor,
  });
  const accountElectronModule = createAccountElectronModule({
    getCloudAccountId: () =>
      mainRuntime?.profileRuntimeManager.getActiveProfileDescriptorSync()?.cloudBinding?.cloudAccountId
      ?? null,
    getCloudAccessToken,
    async updateLocalProfileMetadata(request) {
      if (request.nickname === undefined) return;
      const profileId = mainRuntime?.profileRuntimeManager.getActiveProfileId();
      if (!profileId) return;
      await mainRuntime?.profileRuntimeManager.updateProfileDisplayName(
        profileId,
        request.nickname,
      );
    },
    async pushCloudProfile(token, request) {
      const response = await fetch(`${getApiBaseUrl()}/accounts/me`, {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      const envelope = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: { message?: string };
      } | null;
      if (!response.ok || envelope?.ok !== true) {
        throw new Error(envelope?.error?.message ?? '云端账户资料同步失败');
      }
    },
    async closeCloudAccount(token, request) {
      const response = await fetch(`${getApiBaseUrl()}/accounts/me/close`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      const envelope = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: { message?: string };
      } | null;
      if (!response.ok || envelope?.ok !== true) {
        throw new Error(envelope?.error?.message ?? '云端账号关闭失败');
      }
    },
    async afterCloudAccountClosed() {
      await closeCurrentCloudConnection();
    },
  });

  await bootstrapper
    // Core services
    .register(accountElectronModule)
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

  const profileRuntimeManager = new DesktopProfileRuntimeManager(sharedResolver, profileRegistry);
  const cloudSessionStore = new CloudSessionStore(sharedResolver.rootDir);
  const cloudConnectionManager = new DesktopCloudConnectionManager(
    cloudSessionStore,
    profileRuntimeManager,
  );
  const cloudConnectionService = new DesktopCloudConnectionService(
    profileRuntimeManager,
    cloudSessionStore,
  );
  const deviceAuthCoordinator = new DeviceAuthCoordinator(
    profileRuntimeManager,
    cloudConnectionService,
  );

  // Assemble the explicit runtime owner
  mainRuntime = new DesktopMainRuntime(windowManager, profileRuntimeManager);
  mainRuntime.setDeviceAuthCoordinator(deviceAuthCoordinator);
  registerProfileAccessIpc(
    profileRegistry,
    profileRuntimeManager,
    cloudConnectionManager,
    deviceAuthCoordinator,
  );
  registerCloudAuthIpc(
    profileRegistry,
    profileRuntimeManager,
    cloudSessionStore,
    deviceAuthCoordinator,
  );

  // Set up module registration — this closure captures the business module
  // creation logic and provides it to the runtime manager for profile activation
  profileRuntimeManager.setModuleRegistration(async (bootstrapper, db, profilePaths) => {
    await registerBusinessModules(
      bootstrapper,
      db,
      profilePaths,
      async () => {
        const profileId = profileRuntimeManager.getActiveProfileId();
        return profileId ? cloudSessionStore.getValidToken(profileId) : null;
      },
      async () => {
        const profileId = profileRuntimeManager.getActiveProfileId();
        if (profileId) await cloudSessionStore.remove(profileId);
        await profileRuntimeManager.disableCloudSync();
      },
    );
  });
  profileRuntimeManager.setAfterActivation((profile) => cloudConnectionManager.restore(profile).then(() => undefined));

  // Cross-module event listeners (task→goal 联动) 现由各模块 electron-entry 在
  // profile 激活时自行挂载（见 GoalElectronModule.register → registerGoalEventListeners），
  // 不再由 shell 层集中初始化。

  // Ancillary
  initMemoryMonitorForDev();
  registerCacheIpcHandlers();
  registerDashboardIpcHandler(() => mainRuntime?.profileRuntimeManager.getActiveProfileAccessContext() ?? null);

  const initTime = performance.now() - startTime;
  console.log(`[Shell] Shell runtime initialized in ${initTime.toFixed(2)}ms`);
}

// ═══════════════════════════════════════════════════════════════════════
// Lifecycle
// ═══════════════════════════════════════════════════════════════════════

registerAppLifecycleHandlers(initializeShellRuntime, () => mainRuntime, windowManager);
