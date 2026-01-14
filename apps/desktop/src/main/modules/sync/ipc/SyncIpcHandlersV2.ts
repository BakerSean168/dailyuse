/**
 * Sync Module IPC Handlers (New API)
 *
 * 使用 BaseIPCHandler 统一处理 IPC 请求
 * 基于 SyncIpcChannels 常量定义的通道
 *
 * 功能分组：
 * - Sync Operations：同步操作（开始、取消、重试）
 * - Profile Management：配置管理
 * - Conflict Resolution：冲突解决
 * - Changes & History：变更和历史
 * - Provider Auth：提供者认证（GitHub OAuth）
 * - Import/Export：数据导入导出
 */

import { ipcMain } from 'electron';
import { BaseIPCHandler } from '../../shared/application/base-ipc-handler';
import { SyncIpcChannels } from '@dailyuse/contracts/sync';
import type {
  StartSyncRequest,
  CancelSyncRequest,
  CreateSyncProfileRequest,
  UpdateSyncProfileRequest,
  ResolveConflictRequest,
  PendingChangesRequest,
  SyncHistoryRequest,
  GitHubOAuthCallbackRequest,
  ExportDataRequest,
  ImportDataRequest,
} from '@dailyuse/contracts/sync';

import { SyncDesktopApplicationService } from '../application/SyncDesktopApplicationService';

/**
 * Sync IPC Handler (New API)
 *
 * 处理所有同步相关的 IPC 调用
 */
export class SyncIPCHandlerV2 extends BaseIPCHandler {
  private appService: SyncDesktopApplicationService;

  constructor() {
    super('SyncIPCHandlerV2');
    this.appService = new SyncDesktopApplicationService();
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // ============================================
    // Sync Operations
    // ============================================

    ipcMain.handle(SyncIpcChannels.START_SYNC, async (_, request: StartSyncRequest) => {
      return this.handleRequest(SyncIpcChannels.START_SYNC, () =>
        this.appService.startSync(request)
      );
    });

    ipcMain.handle(SyncIpcChannels.CANCEL_SYNC, async (_, request: CancelSyncRequest) => {
      return this.handleRequest(SyncIpcChannels.CANCEL_SYNC, () =>
        this.appService.cancelSync(request)
      );
    });

    ipcMain.handle(SyncIpcChannels.GET_STATUS, async () => {
      return this.handleRequest(SyncIpcChannels.GET_STATUS, () =>
        this.appService.getSyncStatus()
      );
    });

    ipcMain.handle(SyncIpcChannels.RETRY_SYNC, async (_, { sessionId }: { sessionId: string }) => {
      return this.handleRequest(SyncIpcChannels.RETRY_SYNC, () =>
        this.appService.retrySync(sessionId)
      );
    });

    // ============================================
    // Profile Management
    // ============================================

    ipcMain.handle(SyncIpcChannels.GET_PROFILES, async () => {
      return this.handleRequest(SyncIpcChannels.GET_PROFILES, () =>
        this.appService.getProfiles()
      );
    });

    ipcMain.handle(SyncIpcChannels.GET_PROFILE, async (_, { profileId }: { profileId: string }) => {
      return this.handleRequest(SyncIpcChannels.GET_PROFILE, () =>
        this.appService.getProfile(profileId)
      );
    });

    ipcMain.handle(SyncIpcChannels.CREATE_PROFILE, async (_, request: CreateSyncProfileRequest) => {
      return this.handleRequest(SyncIpcChannels.CREATE_PROFILE, () =>
        this.appService.createProfile(request)
      );
    });

    ipcMain.handle(SyncIpcChannels.UPDATE_PROFILE, async (_, request: UpdateSyncProfileRequest) => {
      return this.handleRequest(SyncIpcChannels.UPDATE_PROFILE, () =>
        this.appService.updateProfile(request)
      );
    });

    ipcMain.handle(SyncIpcChannels.DELETE_PROFILE, async (_, { profileId }: { profileId: string }) => {
      return this.handleRequest(SyncIpcChannels.DELETE_PROFILE, () =>
        this.appService.deleteProfile(profileId)
      );
    });

    ipcMain.handle(SyncIpcChannels.SET_DEFAULT_PROFILE, async (_, { profileId }: { profileId: string }) => {
      return this.handleRequest(SyncIpcChannels.SET_DEFAULT_PROFILE, () =>
        this.appService.setDefaultProfile(profileId)
      );
    });

    ipcMain.handle(SyncIpcChannels.ACTIVATE_PROFILE, async (_, { profileId }: { profileId: string }) => {
      return this.handleRequest(SyncIpcChannels.ACTIVATE_PROFILE, () =>
        this.appService.activateProfile(profileId)
      );
    });

    ipcMain.handle(SyncIpcChannels.DEACTIVATE_PROFILE, async (_, { profileId }: { profileId: string }) => {
      return this.handleRequest(SyncIpcChannels.DEACTIVATE_PROFILE, () =>
        this.appService.deactivateProfile(profileId)
      );
    });

    // ============================================
    // Conflict Resolution
    // ============================================

    ipcMain.handle(SyncIpcChannels.GET_CONFLICTS, async (_, { sessionId }: { sessionId?: string }) => {
      return this.handleRequest(SyncIpcChannels.GET_CONFLICTS, () =>
        this.appService.getConflicts(sessionId)
      );
    });

    ipcMain.handle(SyncIpcChannels.GET_CONFLICT, async (_, { conflictId }: { conflictId: string }) => {
      return this.handleRequest(SyncIpcChannels.GET_CONFLICT, () =>
        this.appService.getConflict(conflictId)
      );
    });

    ipcMain.handle(SyncIpcChannels.RESOLVE_CONFLICT, async (_, request: ResolveConflictRequest) => {
      return this.handleRequest(SyncIpcChannels.RESOLVE_CONFLICT, () =>
        this.appService.resolveConflict(request)
      );
    });

    ipcMain.handle(SyncIpcChannels.IGNORE_CONFLICT, async (_, { conflictId }: { conflictId: string }) => {
      return this.handleRequest(SyncIpcChannels.IGNORE_CONFLICT, () =>
        this.appService.ignoreConflict(conflictId)
      );
    });

    ipcMain.handle(SyncIpcChannels.AUTO_RESOLVE_CONFLICTS, async (_, { sessionId }: { sessionId: string }) => {
      return this.handleRequest(SyncIpcChannels.AUTO_RESOLVE_CONFLICTS, () =>
        this.appService.autoResolveConflicts(sessionId)
      );
    });

    // ============================================
    // Changes & History
    // ============================================

    ipcMain.handle(SyncIpcChannels.GET_PENDING_CHANGES, async (_, request?: PendingChangesRequest) => {
      return this.handleRequest(SyncIpcChannels.GET_PENDING_CHANGES, () =>
        this.appService.getPendingChanges(request)
      );
    });

    ipcMain.handle(SyncIpcChannels.GET_PENDING_COUNT, async () => {
      return this.handleRequest(SyncIpcChannels.GET_PENDING_COUNT, () =>
        this.appService.getPendingCount()
      );
    });

    ipcMain.handle(SyncIpcChannels.GET_HISTORY, async (_, request?: SyncHistoryRequest) => {
      return this.handleRequest(SyncIpcChannels.GET_HISTORY, () =>
        this.appService.getSyncHistory(request)
      );
    });

    ipcMain.handle(SyncIpcChannels.GET_SESSION, async (_, { sessionId }: { sessionId: string }) => {
      return this.handleRequest(SyncIpcChannels.GET_SESSION, () =>
        this.appService.getSession(sessionId)
      );
    });

    // ============================================
    // Provider Authentication (GitHub OAuth)
    // ============================================

    ipcMain.handle(SyncIpcChannels.START_GITHUB_OAUTH, async (_, { profileId }: { profileId: string }) => {
      return this.handleRequest(SyncIpcChannels.START_GITHUB_OAUTH, () =>
        this.appService.startGitHubOAuth(profileId)
      );
    });

    ipcMain.handle(SyncIpcChannels.GITHUB_OAUTH_CALLBACK, async (_, request: GitHubOAuthCallbackRequest) => {
      return this.handleRequest(SyncIpcChannels.GITHUB_OAUTH_CALLBACK, () =>
        this.appService.handleGitHubOAuthCallback(request)
      );
    });

    ipcMain.handle(SyncIpcChannels.CHECK_PROVIDER_CONNECTION, async (_, { profileId }: { profileId: string }) => {
      return this.handleRequest(SyncIpcChannels.CHECK_PROVIDER_CONNECTION, () =>
        this.appService.checkProviderConnection(profileId)
      );
    });

    ipcMain.handle(SyncIpcChannels.DISCONNECT_PROVIDER, async (_, { profileId }: { profileId: string }) => {
      return this.handleRequest(SyncIpcChannels.DISCONNECT_PROVIDER, () =>
        this.appService.disconnectProvider(profileId)
      );
    });

    // ============================================
    // Import/Export
    // ============================================

    ipcMain.handle(SyncIpcChannels.EXPORT_DATA, async (_, request: ExportDataRequest) => {
      return this.handleRequest(SyncIpcChannels.EXPORT_DATA, () =>
        this.appService.exportData(request)
      );
    });

    ipcMain.handle(SyncIpcChannels.IMPORT_DATA, async (_, request: ImportDataRequest) => {
      return this.handleRequest(SyncIpcChannels.IMPORT_DATA, () =>
        this.appService.importData(request)
      );
    });

    this.logger.info('Sync IPC handlers (v2) registered');
  }

  /**
   * Unregister all handlers (for cleanup)
   */
  public unregisterHandlers(): void {
    Object.values(SyncIpcChannels).forEach((channel) => {
      ipcMain.removeHandler(channel);
    });
    this.logger.info('Sync IPC handlers (v2) unregistered');
  }
}

// Singleton instance
let instance: SyncIPCHandlerV2 | null = null;

export function getSyncIPCHandlerV2(): SyncIPCHandlerV2 {
  if (!instance) {
    instance = new SyncIPCHandlerV2();
  }
  return instance;
}

export function resetSyncIPCHandlerV2(): void {
  if (instance) {
    instance.unregisterHandlers();
    instance = null;
  }
}
