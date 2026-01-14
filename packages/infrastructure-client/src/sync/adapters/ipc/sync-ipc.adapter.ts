/**
 * Sync IPC Adapter
 *
 * IPC implementation for Sync API client.
 * Used in Electron desktop app renderer process.
 */

import type { IpcClient } from '../../../shared/ipc-client.types';
import type { ISyncApiClient } from '../../ports/sync-api-client.port';
import { SyncIpcChannels } from '@dailyuse/contracts/sync';
import type {
  StartSyncRequest,
  StartSyncResponse,
  CancelSyncRequest,
  SyncStatusResponse,
  CreateSyncProfileRequest,
  UpdateSyncProfileRequest,
  SyncProfileListResponse,
  ResolveConflictRequest,
  ConflictListResponse,
  PendingChangesRequest,
  PendingChangesResponse,
  SyncHistoryRequest,
  SyncHistoryResponse,
  GitHubOAuthStartResponse,
  GitHubOAuthCallbackRequest,
  ProviderConnectionStatusResponse,
  ExportDataRequest,
  ExportDataResponse,
  ImportDataRequest,
  ImportDataResponse,
} from '@dailyuse/contracts/sync';
import type {
  SyncProfileClientDTO,
  SyncSessionClientDTO,
  SyncConflictClientDTO,
} from '@dailyuse/contracts/sync';

/**
 * Sync IPC Adapter
 *
 * 通过 IPC 与主进程通信的同步客户端适配器
 */
export class SyncIpcAdapter implements ISyncApiClient {
  constructor(private readonly ipcClient: IpcClient) {}

  // ===== 同步操作 =====

  async startSync(request: StartSyncRequest): Promise<StartSyncResponse> {
    return this.ipcClient.invoke<StartSyncResponse>(SyncIpcChannels.START_SYNC, request);
  }

  async cancelSync(request: CancelSyncRequest): Promise<SyncSessionClientDTO> {
    return this.ipcClient.invoke<SyncSessionClientDTO>(SyncIpcChannels.CANCEL_SYNC, request);
  }

  async getSyncStatus(): Promise<SyncStatusResponse> {
    return this.ipcClient.invoke<SyncStatusResponse>(SyncIpcChannels.GET_STATUS);
  }

  async retrySync(sessionId: string): Promise<StartSyncResponse> {
    return this.ipcClient.invoke<StartSyncResponse>(SyncIpcChannels.RETRY_SYNC, { sessionId });
  }

  // ===== 配置管理 =====

  async getProfiles(): Promise<SyncProfileListResponse> {
    return this.ipcClient.invoke<SyncProfileListResponse>(SyncIpcChannels.GET_PROFILES);
  }

  async getProfile(profileId: string): Promise<SyncProfileClientDTO | null> {
    return this.ipcClient.invoke<SyncProfileClientDTO | null>(SyncIpcChannels.GET_PROFILE, {
      profileId,
    });
  }

  async createProfile(request: CreateSyncProfileRequest): Promise<SyncProfileClientDTO> {
    return this.ipcClient.invoke<SyncProfileClientDTO>(SyncIpcChannels.CREATE_PROFILE, request);
  }

  async updateProfile(request: UpdateSyncProfileRequest): Promise<SyncProfileClientDTO> {
    return this.ipcClient.invoke<SyncProfileClientDTO>(SyncIpcChannels.UPDATE_PROFILE, request);
  }

  async deleteProfile(profileId: string): Promise<void> {
    return this.ipcClient.invoke<void>(SyncIpcChannels.DELETE_PROFILE, { profileId });
  }

  async setDefaultProfile(profileId: string): Promise<SyncProfileClientDTO> {
    return this.ipcClient.invoke<SyncProfileClientDTO>(SyncIpcChannels.SET_DEFAULT_PROFILE, {
      profileId,
    });
  }

  async activateProfile(profileId: string): Promise<SyncProfileClientDTO> {
    return this.ipcClient.invoke<SyncProfileClientDTO>(SyncIpcChannels.ACTIVATE_PROFILE, {
      profileId,
    });
  }

  async deactivateProfile(profileId: string): Promise<SyncProfileClientDTO> {
    return this.ipcClient.invoke<SyncProfileClientDTO>(SyncIpcChannels.DEACTIVATE_PROFILE, {
      profileId,
    });
  }

  // ===== 冲突管理 =====

  async getConflicts(sessionId?: string): Promise<ConflictListResponse> {
    return this.ipcClient.invoke<ConflictListResponse>(SyncIpcChannels.GET_CONFLICTS, {
      sessionId,
    });
  }

  async getConflict(conflictId: string): Promise<SyncConflictClientDTO | null> {
    return this.ipcClient.invoke<SyncConflictClientDTO | null>(SyncIpcChannels.GET_CONFLICT, {
      conflictId,
    });
  }

  async resolveConflict(request: ResolveConflictRequest): Promise<SyncConflictClientDTO> {
    return this.ipcClient.invoke<SyncConflictClientDTO>(SyncIpcChannels.RESOLVE_CONFLICT, request);
  }

  async ignoreConflict(conflictId: string): Promise<SyncConflictClientDTO> {
    return this.ipcClient.invoke<SyncConflictClientDTO>(SyncIpcChannels.IGNORE_CONFLICT, {
      conflictId,
    });
  }

  async autoResolveConflicts(sessionId: string): Promise<number> {
    return this.ipcClient.invoke<number>(SyncIpcChannels.AUTO_RESOLVE_CONFLICTS, { sessionId });
  }

  // ===== 变更管理 =====

  async getPendingChanges(request?: PendingChangesRequest): Promise<PendingChangesResponse> {
    return this.ipcClient.invoke<PendingChangesResponse>(
      SyncIpcChannels.GET_PENDING_CHANGES,
      request
    );
  }

  async getPendingCount(): Promise<number> {
    return this.ipcClient.invoke<number>(SyncIpcChannels.GET_PENDING_COUNT);
  }

  // ===== 历史记录 =====

  async getSyncHistory(request?: SyncHistoryRequest): Promise<SyncHistoryResponse> {
    return this.ipcClient.invoke<SyncHistoryResponse>(SyncIpcChannels.GET_HISTORY, request);
  }

  async getSession(sessionId: string): Promise<SyncSessionClientDTO | null> {
    return this.ipcClient.invoke<SyncSessionClientDTO | null>(SyncIpcChannels.GET_SESSION, {
      sessionId,
    });
  }

  // ===== 提供者认证 =====

  async startGitHubOAuth(profileId: string): Promise<GitHubOAuthStartResponse> {
    return this.ipcClient.invoke<GitHubOAuthStartResponse>(SyncIpcChannels.START_GITHUB_OAUTH, {
      profileId,
    });
  }

  async handleGitHubOAuthCallback(
    request: GitHubOAuthCallbackRequest
  ): Promise<SyncProfileClientDTO> {
    return this.ipcClient.invoke<SyncProfileClientDTO>(
      SyncIpcChannels.GITHUB_OAUTH_CALLBACK,
      request
    );
  }

  async checkProviderConnection(profileId: string): Promise<ProviderConnectionStatusResponse> {
    return this.ipcClient.invoke<ProviderConnectionStatusResponse>(
      SyncIpcChannels.CHECK_PROVIDER_CONNECTION,
      { profileId }
    );
  }

  async disconnectProvider(profileId: string): Promise<void> {
    return this.ipcClient.invoke<void>(SyncIpcChannels.DISCONNECT_PROVIDER, { profileId });
  }

  // ===== 导入导出 =====

  async exportData(request: ExportDataRequest): Promise<ExportDataResponse> {
    return this.ipcClient.invoke<ExportDataResponse>(SyncIpcChannels.EXPORT_DATA, request);
  }

  async importData(request: ImportDataRequest): Promise<ImportDataResponse> {
    return this.ipcClient.invoke<ImportDataResponse>(SyncIpcChannels.IMPORT_DATA, request);
  }
}
