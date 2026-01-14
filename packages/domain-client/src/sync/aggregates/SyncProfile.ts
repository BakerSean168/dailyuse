/**
 * SyncProfile 聚合根 (Client)
 * 同步配置文件
 */

import { AggregateRoot } from '@dailyuse/utils';
import {
  SyncProviderType,
  type SyncProfileClientDTO,
  type SyncProfileConfigDTO,
  type SyncProfileClient,
} from '@dailyuse/contracts/sync';
import { SyncProfileConfig } from '../value-objects/SyncProfileConfig';

interface ProviderSummary {
  type: SyncProviderType;
  identifier?: string;
  serverUrl?: string;
}

/**
 * SyncProfile 聚合根
 *
 * 客户端同步配置文件表示
 */
export class SyncProfile extends AggregateRoot implements SyncProfileClient {
  private _name: string;
  private _description?: string | null;
  private _providerType: SyncProviderType;
  private _providerSummary: ProviderSummary;
  private _syncConfig: SyncProfileConfig;
  private _isDefault: boolean;
  private _isActive: boolean;
  private _isConnected: boolean;
  private _lastSyncAt?: number | null;
  private _lastSyncResult?: 'success' | 'failed' | 'partial' | null;
  private _statusLabel: string;
  private _nextAutoSyncAt?: number | null;
  private _createdAt: number;
  private _updatedAt: number;

  private constructor(params: {
    uuid: string;
    name: string;
    description?: string | null;
    providerType: SyncProviderType;
    providerSummary: ProviderSummary;
    syncConfig: SyncProfileConfig;
    isDefault: boolean;
    isActive: boolean;
    isConnected: boolean;
    lastSyncAt?: number | null;
    lastSyncResult?: 'success' | 'failed' | 'partial' | null;
    statusLabel: string;
    nextAutoSyncAt?: number | null;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid);
    this._name = params.name;
    this._description = params.description;
    this._providerType = params.providerType;
    this._providerSummary = params.providerSummary;
    this._syncConfig = params.syncConfig;
    this._isDefault = params.isDefault;
    this._isActive = params.isActive;
    this._isConnected = params.isConnected;
    this._lastSyncAt = params.lastSyncAt;
    this._lastSyncResult = params.lastSyncResult;
    this._statusLabel = params.statusLabel;
    this._nextAutoSyncAt = params.nextAutoSyncAt;
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

  get providerSummary(): ProviderSummary {
    return this._providerSummary;
  }

  get syncConfig(): SyncProfileConfig {
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

  get lastSyncResult(): 'success' | 'failed' | 'partial' | null | undefined {
    return this._lastSyncResult;
  }

  get statusLabel(): string {
    return this._statusLabel;
  }

  get nextAutoSyncAt(): number | null | undefined {
    return this._nextAutoSyncAt;
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get updatedAt(): number {
    return this._updatedAt;
  }

  // ===== 静态工厂方法 =====

  static fromClientDTO(dto: SyncProfileClientDTO): SyncProfile {
    return new SyncProfile({
      uuid: dto.uuid,
      name: dto.name,
      description: dto.description,
      providerType: dto.providerType,
      providerSummary: dto.providerSummary,
      syncConfig: SyncProfileConfig.fromDTO(dto.syncConfig),
      isDefault: dto.isDefault,
      isActive: dto.isActive,
      isConnected: dto.isConnected,
      lastSyncAt: dto.lastSyncAt,
      lastSyncResult: dto.lastSyncResult,
      statusLabel: dto.statusLabel,
      nextAutoSyncAt: dto.nextAutoSyncAt,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  // ===== 接口方法 =====

  canSync(): boolean {
    return this._isActive && this._isConnected;
  }

  // ===== UI 辅助属性 =====

  /**
   * 提供者类型显示文本
   */
  get providerTypeDisplay(): string {
    const map: Record<SyncProviderType, string> = {
      [SyncProviderType.GITHUB_GIST]: 'GitHub Gist',
      [SyncProviderType.WEBDAV]: 'WebDAV',
      [SyncProviderType.CUSTOM_SERVER]: '自定义服务器',
      [SyncProviderType.LOCAL_FILE]: '本地文件',
    };
    return map[this._providerType];
  }

  /**
   * 提供者图标
   */
  get providerIcon(): string {
    const iconMap: Record<SyncProviderType, string> = {
      [SyncProviderType.GITHUB_GIST]: '🐙',
      [SyncProviderType.WEBDAV]: '☁️',
      [SyncProviderType.CUSTOM_SERVER]: '🖥️',
      [SyncProviderType.LOCAL_FILE]: '📁',
    };
    return iconMap[this._providerType];
  }

  /**
   * 连接状态显示文本
   */
  get connectionStatusDisplay(): string {
    return this._isConnected ? '已连接' : '未连接';
  }

  /**
   * 连接状态颜色
   */
  get connectionStatusColor(): string {
    return this._isConnected ? '#10b981' : '#ef4444';
  }

  /**
   * 激活状态显示文本
   */
  get activeStatusDisplay(): string {
    return this._isActive ? '已启用' : '已禁用';
  }

  /**
   * 激活状态颜色
   */
  get activeStatusColor(): string {
    return this._isActive ? '#10b981' : '#6b7280';
  }

  /**
   * 最后同步时间格式化
   */
  get lastSyncAtFormatted(): string | null {
    return this._lastSyncAt ? new Date(this._lastSyncAt).toLocaleString() : null;
  }

  /**
   * 最后同步时间相对描述
   */
  get lastSyncAtRelative(): string | null {
    if (!this._lastSyncAt) return null;
    const now = Date.now();
    const diff = now - this._lastSyncAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} 天前`;
    if (hours > 0) return `${hours} 小时前`;
    if (minutes > 0) return `${minutes} 分钟前`;
    return '刚刚';
  }

  /**
   * 最后同步结果显示文本
   */
  get lastSyncResultDisplay(): string | null {
    if (!this._lastSyncResult) return null;
    const map: Record<string, string> = {
      success: '成功',
      failed: '失败',
      partial: '部分成功',
    };
    return map[this._lastSyncResult];
  }

  /**
   * 最后同步结果颜色
   */
  get lastSyncResultColor(): string | null {
    if (!this._lastSyncResult) return null;
    const colorMap: Record<string, string> = {
      success: '#10b981',
      failed: '#ef4444',
      partial: '#f59e0b',
    };
    return colorMap[this._lastSyncResult];
  }

  /**
   * 下次自动同步时间格式化
   */
  get nextAutoSyncAtFormatted(): string | null {
    return this._nextAutoSyncAt ? new Date(this._nextAutoSyncAt).toLocaleString() : null;
  }

  /**
   * 下次自动同步时间相对描述
   */
  get nextAutoSyncAtRelative(): string | null {
    if (!this._nextAutoSyncAt) return null;
    const now = Date.now();
    const diff = this._nextAutoSyncAt - now;
    if (diff <= 0) return '即将开始';
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours} 小时后`;
    }
    return `${minutes} 分钟后`;
  }

  /**
   * 提供者摘要显示
   */
  get providerSummaryDisplay(): string {
    if (this._providerSummary.identifier) {
      return this._providerSummary.identifier;
    }
    if (this._providerSummary.serverUrl) {
      return this._providerSummary.serverUrl;
    }
    return this.providerTypeDisplay;
  }

  /**
   * 创建时间格式化
   */
  get createdAtFormatted(): string {
    return new Date(this._createdAt).toLocaleString();
  }

  /**
   * 更新时间格式化
   */
  get updatedAtFormatted(): string {
    return new Date(this._updatedAt).toLocaleString();
  }

  // ===== DTO 转换 =====

  toClientDTO(): SyncProfileClientDTO {
    return {
      uuid: this.uuid,
      name: this._name,
      description: this._description,
      providerType: this._providerType,
      providerSummary: this._providerSummary,
      syncConfig: this._syncConfig.toDTO(),
      isDefault: this._isDefault,
      isActive: this._isActive,
      isConnected: this._isConnected,
      lastSyncAt: this._lastSyncAt,
      lastSyncResult: this._lastSyncResult,
      statusLabel: this._statusLabel,
      nextAutoSyncAt: this._nextAutoSyncAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}
