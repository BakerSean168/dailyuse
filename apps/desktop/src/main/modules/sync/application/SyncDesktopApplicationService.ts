/**
 * Sync Desktop Application Service
 *
 * 桌面端同步模块应用服务
 * 使用 application-server/sync 服务实现同步功能
 */

import { createLogger, type ILogger } from '@dailyuse/utils';
import {
  type StartSyncRequest,
  type StartSyncResponse,
  type CancelSyncRequest,
  type SyncStatusResponse,
  type CreateSyncProfileRequest,
  type UpdateSyncProfileRequest,
  type SyncProfileListResponse,
  type SyncProfileClientDTO,
  type SyncSessionClientDTO,
  type ResolveConflictRequest,
  type ConflictListResponse,
  type SyncConflictClientDTO,
  type PendingChangesRequest,
  type PendingChangesResponse,
  type SyncHistoryRequest,
  type SyncHistoryResponse,
  type GitHubOAuthStartResponse,
  type GitHubOAuthCallbackRequest,
  type ProviderConnectionStatusResponse,
  type ExportDataRequest,
  type ExportDataResponse,
  type ImportDataRequest,
  type ImportDataResponse,
  type DeviceInfoDTO,
} from '@dailyuse/contracts/sync';
import {
  SyncSessionApplicationService,
  SyncProfileApplicationService,
  SyncConflictApplicationService,
  SyncStateApplicationService,
  PendingChangeApplicationService,
} from '@dailyuse/sync/application-server';
import {
  SyncProfileMemoryRepository,
  SyncSessionMemoryRepository,
  SyncConflictMemoryRepository,
  PendingChangeMemoryRepository,
} from '@dailyuse/sync/infrastructure-server';
import * as os from 'os';

/**
 * 单例实例
 */
let instance: SyncDesktopApplicationService | null = null;

/**
 * Sync Desktop Application Service
 *
 * 提供同步功能的应用层服务
 */
export class SyncDesktopApplicationService {
  private readonly logger: ILogger;
  private readonly deviceInfo: DeviceInfoDTO;
  private readonly identityId = 'default-account';

  // Application Services (initialized in constructor)
  private sessionService!: SyncSessionApplicationService;
  private profileService!: SyncProfileApplicationService;
  private conflictService!: SyncConflictApplicationService;
  private stateService!: SyncStateApplicationService;
  private changeService!: PendingChangeApplicationService;

  constructor() {
    this.logger = createLogger('SyncDesktopApplicationService');
    this.deviceInfo = this.createDeviceInfo();
    
    // Initialize services synchronously to satisfy definite assignment
    this.initializeServices();
  }

  /**
   * 创建设备信息
   */
  private createDeviceInfo(): DeviceInfoDTO {
    return {
      deviceId: this.generateDeviceId(),
      deviceName: os.hostname() || 'Desktop',
      deviceType: 'desktop',
      os: `${os.platform()} ${os.release()}`,
      appVersion: '1.0.0',
      lastActiveAt: Date.now(),
    };
  }

  /**
   * 初始化服务和仓储
   */
  private initializeServices(): void {
    // 创建内存仓储
    const sessionRepository = new SyncSessionMemoryRepository();
    const profileRepository = new SyncProfileMemoryRepository();
    const conflictRepository = new SyncConflictMemoryRepository();
    const changeRepository = new PendingChangeMemoryRepository();

    // 创建应用服务
    this.sessionService = new SyncSessionApplicationService(
      sessionRepository,
      profileRepository,
      this.identityId,
      this.deviceInfo
    );

    this.profileService = new SyncProfileApplicationService(
      profileRepository,
      this.identityId
    );

    this.conflictService = new SyncConflictApplicationService(
      conflictRepository,
      this.identityId
    );

    this.changeService = new PendingChangeApplicationService(
      changeRepository,
      this.identityId
    );

    this.stateService = new SyncStateApplicationService(
      this.profileService,
      this.sessionService,
      this.changeService,
      this.conflictService,
      this.identityId
    );
  }

  // ===== 同步操作 =====

  async startSync(request: StartSyncRequest): Promise<StartSyncResponse> {
    this.logger.info('Starting sync', { profileId: request.profileId });
    return this.sessionService.startSync(request);
  }

  async cancelSync(request: CancelSyncRequest): Promise<SyncSessionClientDTO> {
    this.logger.info('Cancelling sync', { sessionId: request.sessionId });
    return this.sessionService.cancelSync(request.sessionId);
  }

  async getSyncStatus(): Promise<SyncStatusResponse> {
    return this.stateService.getSyncStatus();
  }

  async retrySync(sessionId: string): Promise<StartSyncResponse> {
    this.logger.info('Retrying sync', { sessionId });
    return this.sessionService.retrySync(sessionId);
  }

  // ===== 配置管理 =====

  async getProfiles(): Promise<SyncProfileListResponse> {
    return this.profileService.listProfiles();
  }

  async getProfile(profileId: string): Promise<SyncProfileClientDTO | null> {
    return this.profileService.getProfile(profileId);
  }

  async createProfile(request: CreateSyncProfileRequest): Promise<SyncProfileClientDTO> {
    return this.profileService.createProfile(request);
  }

  async updateProfile(request: UpdateSyncProfileRequest): Promise<SyncProfileClientDTO> {
    return this.profileService.updateProfile(request);
  }

  async deleteProfile(profileId: string): Promise<void> {
    return this.profileService.deleteProfile(profileId);
  }

  async setDefaultProfile(profileId: string): Promise<SyncProfileClientDTO> {
    return this.profileService.setDefaultProfile(profileId);
  }

  async activateProfile(profileId: string): Promise<SyncProfileClientDTO> {
    return this.profileService.activateProfile(profileId);
  }

  async deactivateProfile(profileId: string): Promise<SyncProfileClientDTO> {
    return this.profileService.deactivateProfile(profileId);
  }

  // ===== 冲突解决 =====

  async getConflicts(sessionId?: string): Promise<ConflictListResponse> {
    return this.conflictService.getUnresolvedConflicts(sessionId);
  }

  async getConflict(conflictId: string): Promise<SyncConflictClientDTO | null> {
    return this.conflictService.getConflict(conflictId);
  }

  async resolveConflict(request: ResolveConflictRequest): Promise<SyncConflictClientDTO> {
    return this.conflictService.resolveConflict(request);
  }

  async ignoreConflict(conflictId: string): Promise<SyncConflictClientDTO> {
    return this.conflictService.ignoreConflict(conflictId);
  }

  async autoResolveConflicts(sessionId: string): Promise<SyncConflictClientDTO[]> {
    return this.conflictService.autoResolveConflicts(sessionId);
  }

  // ===== 变更管理 =====

  async getPendingChanges(request: PendingChangesRequest = {}): Promise<PendingChangesResponse> {
    return this.changeService.getPendingChanges(request);
  }

  async getPendingCount(): Promise<number> {
    return this.changeService.getPendingCount();
  }

  // ===== 历史记录 =====

  async getSyncHistory(request?: SyncHistoryRequest): Promise<SyncHistoryResponse> {
    return this.sessionService.getSyncHistory(request ?? {});
  }

  async getSession(sessionId: string): Promise<SyncSessionClientDTO | null> {
    return this.sessionService.getSession(sessionId);
  }

  // ===== 提供者认证 =====

  async startGitHubOAuth(_profileId: string): Promise<GitHubOAuthStartResponse> {
    // TODO: 实现 GitHub OAuth 流程
    return {
      authUrl: '',
      state: '',
    };
  }

  async handleGitHubOAuthCallback(_request: GitHubOAuthCallbackRequest): Promise<SyncProfileClientDTO> {
    throw new Error('Not implemented: GitHub OAuth callback');
  }

  async checkProviderConnection(_profileId: string): Promise<ProviderConnectionStatusResponse> {
    return {
      isConnected: false,
    };
  }

  async disconnectProvider(_profileId: string): Promise<void> {
    // TODO: 断开提供者连接
  }

  // ===== 导入导出 =====

  async exportData(_request: ExportDataRequest): Promise<ExportDataResponse> {
    return {
      ok: false,
      error: 'Not implemented: data export',
      statistics: {},
      fileSize: 0,
    };
  }

  async importData(_request: ImportDataRequest): Promise<ImportDataResponse> {
    return {
      ok: false,
      error: 'Not implemented: data import',
      imported: {},
      skipped: 0,
      overwritten: 0,
      warnings: [],
    };
  }

  // ===== 辅助方法 =====

  private generateDeviceId(): string {
    // TODO: 从持久化存储读取或生成新的设备 ID
    return `desktop-${Date.now()}`;
  }
}

/**
 * 获取 SyncDesktopApplicationService 单例
 */
export function getSyncDesktopApplicationService(): SyncDesktopApplicationService {
  if (!instance) {
    instance = new SyncDesktopApplicationService();
  }
  return instance;
}

/**
 * 重置单例（用于测试）
 */
export function resetSyncDesktopApplicationService(): void {
  instance = null;
}
