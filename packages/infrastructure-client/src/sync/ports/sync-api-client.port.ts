/**
 * Sync API Client Port Interface
 *
 * Defines the contract for Sync API operations.
 * Implementations: SyncIpcAdapter (desktop)
 */

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
 * Sync API Client Interface
 *
 * 同步模块 API 客户端接口
 */
export interface ISyncApiClient {
  // ===== 同步操作 =====

  /** 启动同步 */
  startSync(request: StartSyncRequest): Promise<StartSyncResponse>;

  /** 取消同步 */
  cancelSync(request: CancelSyncRequest): Promise<SyncSessionClientDTO>;

  /** 获取同步状态 */
  getSyncStatus(): Promise<SyncStatusResponse>;

  /** 重试同步 */
  retrySync(sessionId: string): Promise<StartSyncResponse>;

  // ===== 配置管理 =====

  /** 获取配置列表 */
  getProfiles(): Promise<SyncProfileListResponse>;

  /** 获取配置详情 */
  getProfile(profileId: string): Promise<SyncProfileClientDTO | null>;

  /** 创建配置 */
  createProfile(request: CreateSyncProfileRequest): Promise<SyncProfileClientDTO>;

  /** 更新配置 */
  updateProfile(request: UpdateSyncProfileRequest): Promise<SyncProfileClientDTO>;

  /** 删除配置 */
  deleteProfile(profileId: string): Promise<void>;

  /** 设置默认配置 */
  setDefaultProfile(profileId: string): Promise<SyncProfileClientDTO>;

  /** 激活配置 */
  activateProfile(profileId: string): Promise<SyncProfileClientDTO>;

  /** 停用配置 */
  deactivateProfile(profileId: string): Promise<SyncProfileClientDTO>;

  // ===== 冲突管理 =====

  /** 获取冲突列表 */
  getConflicts(sessionId?: string): Promise<ConflictListResponse>;

  /** 获取冲突详情 */
  getConflict(conflictId: string): Promise<SyncConflictClientDTO | null>;

  /** 解决冲突 */
  resolveConflict(request: ResolveConflictRequest): Promise<SyncConflictClientDTO>;

  /** 忽略冲突 */
  ignoreConflict(conflictId: string): Promise<SyncConflictClientDTO>;

  /** 自动解决所有冲突 */
  autoResolveConflicts(sessionId: string): Promise<number>;

  // ===== 变更管理 =====

  /** 获取待同步变更 */
  getPendingChanges(request?: PendingChangesRequest): Promise<PendingChangesResponse>;

  /** 获取待同步数量 */
  getPendingCount(): Promise<number>;

  // ===== 历史记录 =====

  /** 获取同步历史 */
  getSyncHistory(request?: SyncHistoryRequest): Promise<SyncHistoryResponse>;

  /** 获取会话详情 */
  getSession(sessionId: string): Promise<SyncSessionClientDTO | null>;

  // ===== 提供者认证 =====

  /** 开始 GitHub OAuth 授权 */
  startGitHubOAuth(profileId: string): Promise<GitHubOAuthStartResponse>;

  /** GitHub OAuth 回调 */
  handleGitHubOAuthCallback(request: GitHubOAuthCallbackRequest): Promise<SyncProfileClientDTO>;

  /** 检查提供者连接状态 */
  checkProviderConnection(profileId: string): Promise<ProviderConnectionStatusResponse>;

  /** 断开提供者连接 */
  disconnectProvider(profileId: string): Promise<void>;

  // ===== 导入导出 =====

  /** 导出数据 */
  exportData(request: ExportDataRequest): Promise<ExportDataResponse>;

  /** 导入数据 */
  importData(request: ImportDataRequest): Promise<ImportDataResponse>;
}
