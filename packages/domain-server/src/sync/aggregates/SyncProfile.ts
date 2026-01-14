/**
 * SyncProfile 聚合根
 * 同步配置文件
 */

import { AggregateRoot } from '@dailyuse/utils';
import {
  SyncProviderType,
  type SyncProfileServerDTO,
  type SyncProfileClientDTO,
  type SyncProfilePersistenceDTO,
  type SyncProfileConfigDTO,
  type SyncProviderConfigDTO,
  type SyncVersionServerDTO,
} from '@dailyuse/contracts/sync';
import { SyncProfileConfig } from '../value-objects/SyncProfileConfig';

interface HistoryStats {
  totalSyncs: number;
  successfulSyncs: number;
  failedSyncs: number;
  averageDurationMs: number;
}

/**
 * SyncProfile 聚合根
 *
 * 同步配置文件
 */
export class SyncProfile extends AggregateRoot {
  private _name: string;
  private _description?: string | null;
  private _providerType: SyncProviderType;
  private _providerConfig: SyncProviderConfigDTO;
  private _syncConfig: SyncProfileConfigDTO;
  private _isDefault: boolean;
  private _isActive: boolean;
  private _isConnected: boolean;
  private _lastSyncAt?: number | null;
  private _lastSyncVersion?: SyncVersionServerDTO | null;
  private _lastSyncResult?: 'success' | 'failed' | 'partial' | null;
  private _historyStats: HistoryStats;
  private _createdAt: number;
  private _updatedAt: number;

  private constructor(params: {
    uuid: string;
    name: string;
    description?: string | null;
    providerType: SyncProviderType;
    providerConfig: SyncProviderConfigDTO;
    syncConfig: SyncProfileConfigDTO;
    isDefault: boolean;
    isActive: boolean;
    isConnected: boolean;
    lastSyncAt?: number | null;
    lastSyncVersion?: SyncVersionServerDTO | null;
    lastSyncResult?: 'success' | 'failed' | 'partial' | null;
    historyStats: HistoryStats;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid);
    this._name = params.name;
    this._description = params.description;
    this._providerType = params.providerType;
    this._providerConfig = params.providerConfig;
    this._syncConfig = params.syncConfig;
    this._isDefault = params.isDefault;
    this._isActive = params.isActive;
    this._isConnected = params.isConnected;
    this._lastSyncAt = params.lastSyncAt;
    this._lastSyncVersion = params.lastSyncVersion;
    this._lastSyncResult = params.lastSyncResult;
    this._historyStats = params.historyStats;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
  }

  // ===== Getters =====

  override get uuid(): string {
    return this._uuid;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null | undefined {
    return this._description;
  }

  get providerType(): SyncProviderType {
    return this._providerType;
  }

  get providerConfig(): SyncProviderConfigDTO {
    return this._providerConfig;
  }

  get syncConfig(): SyncProfileConfigDTO {
    return this._syncConfig;
  }

  get isDefault(): boolean {
    return this._isDefault;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  get lastSyncAt(): number | null | undefined {
    return this._lastSyncAt;
  }

  get lastSyncVersion(): SyncVersionServerDTO | null | undefined {
    return this._lastSyncVersion;
  }

  get lastSyncResult(): 'success' | 'failed' | 'partial' | null | undefined {
    return this._lastSyncResult;
  }

  get historyStats(): HistoryStats {
    return this._historyStats;
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建新的同步配置文件
   */
  static create(params: {
    name: string;
    description?: string;
    providerType: SyncProviderType;
    providerConfig: SyncProviderConfigDTO;
    syncConfig?: SyncProfileConfigDTO;
  }): SyncProfile {
    const now = Date.now();
    return new SyncProfile({
      uuid: AggregateRoot.generateUUID(),
      name: params.name,
      description: params.description,
      providerType: params.providerType,
      providerConfig: params.providerConfig,
      syncConfig: params.syncConfig ?? SyncProfileConfig.createDefault().toDTO(),
      isDefault: false,
      isActive: true,
      isConnected: false,
      historyStats: {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        averageDurationMs: 0,
      },
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 ServerDTO 重建
   */
  static fromServerDTO(dto: SyncProfileServerDTO): SyncProfile {
    return new SyncProfile({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      providerType: dto.providerType,
      providerConfig: dto.providerConfig,
      syncConfig: dto.syncConfig,
      isDefault: dto.isDefault,
      isActive: dto.isActive,
      isConnected: dto.isConnected,
      lastSyncAt: dto.lastSyncAt,
      lastSyncVersion: dto.lastSyncVersion,
      lastSyncResult: dto.lastSyncResult,
      historyStats: dto.historyStats,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  /**
   * 从 PersistenceDTO 重建
   */
  static fromPersistenceDTO(dto: SyncProfilePersistenceDTO): SyncProfile {
    return new SyncProfile({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      providerType: dto.providerType as SyncProviderType,
      providerConfig: JSON.parse(dto.providerConfigJson),
      syncConfig: JSON.parse(dto.syncConfigJson),
      isDefault: dto.isDefault,
      isActive: dto.isActive,
      isConnected: dto.isConnected,
      lastSyncAt: dto.lastSyncAt,
      lastSyncVersion: dto.lastSyncVersionJson
        ? JSON.parse(dto.lastSyncVersionJson)
        : null,
      lastSyncResult: dto.lastSyncResult as 'success' | 'failed' | 'partial' | null,
      historyStats: JSON.parse(dto.historyStatsJson),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  // ===== 业务方法 =====

  /**
   * 更新名称
   */
  updateName(name: string): void {
    if (!name || name.trim() === '') {
      throw new Error('SyncProfile: name cannot be empty');
    }
    this._name = name.trim();
    this._updatedAt = Date.now();
  }

  /**
   * 更新同步配置
   */
  updateSyncConfig(config: SyncProfileConfigDTO): void {
    this._syncConfig = config;
    this._updatedAt = Date.now();
  }

  /**
   * 更新提供者配置
   */
  updateProviderConfig(config: SyncProviderConfigDTO): void {
    this._providerConfig = config;
    this._updatedAt = Date.now();
  }

  /**
   * 设置为默认配置
   */
  setAsDefault(): void {
    this._isDefault = true;
    this._updatedAt = Date.now();
  }

  /**
   * 取消默认配置
   */
  unsetDefault(): void {
    this._isDefault = false;
    this._updatedAt = Date.now();
  }

  /**
   * 激活配置文件
   */
  activate(): void {
    this._isActive = true;
    this._updatedAt = Date.now();
  }

  /**
   * 停用配置文件
   */
  deactivate(): void {
    this._isActive = false;
    this._updatedAt = Date.now();
  }

  /**
   * 设置连接状态
   */
  setConnected(connected: boolean): void {
    this._isConnected = connected;
    this._updatedAt = Date.now();
  }

  /**
   * 记录同步完成
   */
  recordSyncComplete(
    version: SyncVersionServerDTO,
    result: 'success' | 'failed' | 'partial',
    durationMs: number,
  ): void {
    this._lastSyncAt = Date.now();
    this._lastSyncVersion = version;
    this._lastSyncResult = result;

    // 更新历史统计
    const totalSyncs = this._historyStats.totalSyncs + 1;
    const successfulSyncs =
      result === 'success'
        ? this._historyStats.successfulSyncs + 1
        : this._historyStats.successfulSyncs;
    const failedSyncs =
      result === 'failed'
        ? this._historyStats.failedSyncs + 1
        : this._historyStats.failedSyncs;
    const averageDurationMs =
      (this._historyStats.averageDurationMs * this._historyStats.totalSyncs + durationMs) /
      totalSyncs;

    this._historyStats = {
      totalSyncs,
      successfulSyncs,
      failedSyncs,
      averageDurationMs,
    };

    this._updatedAt = Date.now();
  }

  // ===== 查询方法 =====

  /**
   * 是否可以同步
   */
  canSync(): boolean {
    return this._isActive && this._isConnected;
  }

  /**
   * 获取状态标签
   */
  get statusLabel(): string {
    if (!this._isActive) return 'Disabled';
    if (!this._isConnected) return 'Not Connected';
    return 'Ready';
  }

  // ===== DTO 转换 =====

  toServerDTO(): SyncProfileServerDTO {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      providerType: this._providerType,
      providerConfig: this._providerConfig,
      syncConfig: this._syncConfig,
      isDefault: this._isDefault,
      isActive: this._isActive,
      isConnected: this._isConnected,
      lastSyncAt: this._lastSyncAt,
      lastSyncVersion: this._lastSyncVersion,
      lastSyncResult: this._lastSyncResult,
      historyStats: this._historyStats,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  toClientDTO(): SyncProfileClientDTO {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      providerType: this._providerType,
      providerSummary: {
        type: this._providerType,
        identifier:
          this._providerConfig.type === 'GITHUB_GIST'
            ? this._providerConfig.gistId
            : undefined,
        serverUrl:
          this._providerConfig.type === 'WEBDAV'
            ? this._providerConfig.serverUrl
            : undefined,
      },
      syncConfig: this._syncConfig,
      isDefault: this._isDefault,
      isActive: this._isActive,
      isConnected: this._isConnected,
      lastSyncAt: this._lastSyncAt,
      lastSyncResult: this._lastSyncResult,
      statusLabel: this.statusLabel,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  toPersistenceDTO(): SyncProfilePersistenceDTO {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description ?? null,
      providerType: this._providerType,
      providerConfigJson: JSON.stringify(this._providerConfig),
      syncConfigJson: JSON.stringify(this._syncConfig),
      isDefault: this._isDefault,
      isActive: this._isActive,
      isConnected: this._isConnected,
      lastSyncAt: this._lastSyncAt ?? null,
      lastSyncVersionJson: this._lastSyncVersion
        ? JSON.stringify(this._lastSyncVersion)
        : null,
      lastSyncResult: this._lastSyncResult ?? null,
      historyStatsJson: JSON.stringify(this._historyStats),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
