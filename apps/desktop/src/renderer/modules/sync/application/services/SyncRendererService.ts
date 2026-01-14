/**
 * Sync Application Services - Renderer
 *
 * 渲染进程同步服务
 * 封装 application-client/sync 服务
 */

import {
  StartSync,
  CancelSync,
  GetSyncStatus,
  RetrySync,
  GetSyncProfiles,
  GetSyncProfile,
  CreateSyncProfile,
  UpdateSyncProfile,
  DeleteSyncProfile,
  SetDefaultSyncProfile,
  ActivateSyncProfile,
  GetSyncConflicts,
  ResolveSyncConflict,
  GetPendingChanges,
  GetSyncHistory,
  StartGitHubOAuth,
  ExportData,
  ImportData,
} from '@dailyuse/application-client/sync';
import type {
  StartSyncRequest,
  StartSyncResponse,
  CancelSyncRequest,
  SyncStatusResponse,
  CreateSyncProfileRequest,
  UpdateSyncProfileRequest,
  SyncProfileListResponse,
  SyncProfileClientDTO,
  SyncSessionClientDTO,
  ResolveConflictRequest,
  SyncConflictClientDTO,
  PendingChangesRequest,
  PendingChangesResponse,
  SyncHistoryRequest,
  SyncHistoryResponse,
  GitHubOAuthStartResponse,
  ExportDataRequest,
  ExportDataResponse,
  ImportDataRequest,
  ImportDataResponse,
  PendingChangeClientDTO,
} from '@dailyuse/contracts/sync';

/**
 * Sync Renderer Service
 *
 * 统一的同步服务门面
 */
export class SyncRendererService {
  private static instance: SyncRendererService;

  private startSync: StartSync;
  private cancelSync: CancelSync;
  private getSyncStatus: GetSyncStatus;
  private retrySync: RetrySync;
  private getProfiles: GetSyncProfiles;
  private getProfile: GetSyncProfile;
  private createProfile: CreateSyncProfile;
  private updateProfile: UpdateSyncProfile;
  private deleteProfile: DeleteSyncProfile;
  private setDefaultProfile: SetDefaultSyncProfile;
  private activateProfile: ActivateSyncProfile;
  private getConflicts: GetSyncConflicts;
  private resolveConflict: ResolveSyncConflict;
  private getPendingChanges: GetPendingChanges;
  private getSyncHistory: GetSyncHistory;
  private startGitHubOAuth: StartGitHubOAuth;
  private exportData: ExportData;
  private importData: ImportData;

  private constructor() {
    this.startSync = StartSync.getInstance();
    this.cancelSync = CancelSync.getInstance();
    this.getSyncStatus = GetSyncStatus.getInstance();
    this.retrySync = RetrySync.getInstance();
    this.getProfiles = GetSyncProfiles.getInstance();
    this.getProfile = GetSyncProfile.getInstance();
    this.createProfile = CreateSyncProfile.getInstance();
    this.updateProfile = UpdateSyncProfile.getInstance();
    this.deleteProfile = DeleteSyncProfile.getInstance();
    this.setDefaultProfile = SetDefaultSyncProfile.getInstance();
    this.activateProfile = ActivateSyncProfile.getInstance();
    this.getConflicts = GetSyncConflicts.getInstance();
    this.resolveConflict = ResolveSyncConflict.getInstance();
    this.getPendingChanges = GetPendingChanges.getInstance();
    this.getSyncHistory = GetSyncHistory.getInstance();
    this.startGitHubOAuth = StartGitHubOAuth.getInstance();
    this.exportData = ExportData.getInstance();
    this.importData = ImportData.getInstance();
  }

  static getInstance(): SyncRendererService {
    if (!SyncRendererService.instance) {
      SyncRendererService.instance = new SyncRendererService();
    }
    return SyncRendererService.instance;
  }

  // ===== 同步操作 =====

  async start(request: StartSyncRequest): Promise<StartSyncResponse> {
    return this.startSync.execute(request);
  }

  async cancel(request: CancelSyncRequest): Promise<SyncSessionClientDTO> {
    const session = await this.cancelSync.execute(request);
    return session.toClientDTO();
  }

  async getStatus(): Promise<SyncStatusResponse> {
    return this.getSyncStatus.execute();
  }

  async retry(sessionId: string): Promise<StartSyncResponse> {
    return this.retrySync.execute(sessionId);
  }

  // ===== 配置管理 =====

  async listProfiles(): Promise<SyncProfileListResponse> {
    return this.getProfiles.execute();
  }

  async fetchProfile(profileId: string): Promise<SyncProfileClientDTO | null> {
    return this.getProfile.execute(profileId);
  }

  async addProfile(request: CreateSyncProfileRequest): Promise<SyncProfileClientDTO> {
    return this.createProfile.execute(request);
  }

  async editProfile(request: UpdateSyncProfileRequest): Promise<SyncProfileClientDTO> {
    return this.updateProfile.execute(request);
  }

  async removeProfile(profileId: string): Promise<void> {
    return this.deleteProfile.execute(profileId);
  }

  async setAsDefault(profileId: string): Promise<SyncProfileClientDTO> {
    return this.setDefaultProfile.execute(profileId);
  }

  async activate(profileId: string): Promise<SyncProfileClientDTO> {
    return this.activateProfile.execute(profileId);
  }

  // ===== 冲突管理 =====

  /**
   * 获取冲突列表
   */
  async listConflicts(sessionId?: string): Promise<{
    conflicts: SyncConflictClientDTO[];
    total: number;
  }> {
    const result = await this.getConflicts.execute(sessionId);
    return {
      conflicts: result.conflicts.map((c) => c.toClientDTO()),
      total: result.total,
    };
  }

  /**
   * 解决冲突
   */
  async resolve(request: ResolveConflictRequest): Promise<SyncConflictClientDTO> {
    const conflict = await this.resolveConflict.execute(request);
    return conflict.toClientDTO();
  }

  // ===== 变更与历史 =====

  /**
   * 获取待同步变更
   */
  async listPendingChanges(request?: PendingChangesRequest): Promise<{
    changes: PendingChangeClientDTO[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    const result = await this.getPendingChanges.execute(request);
    return {
      changes: result.changes.map((c) => c.toClientDTO()),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
    };
  }

  /**
   * 获取同步历史
   */
  async history(request?: SyncHistoryRequest): Promise<{
    sessions: SyncSessionClientDTO[];
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  }> {
    const result = await this.getSyncHistory.execute(request);
    return {
      sessions: result.sessions.map((s) => s.toClientDTO()),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
    };
  }

  // ===== GitHub OAuth =====

  async beginGitHubOAuth(profileId: string): Promise<GitHubOAuthStartResponse> {
    return this.startGitHubOAuth.execute(profileId);
  }

  // ===== 导入导出 =====

  async export(request: ExportDataRequest): Promise<ExportDataResponse> {
    return this.exportData.execute(request);
  }

  async import(request: ImportDataRequest): Promise<ImportDataResponse> {
    return this.importData.execute(request);
  }
}

/**
 * 获取 Sync 服务实例
 */
export function getSyncService(): SyncRendererService {
  return SyncRendererService.getInstance();
}
