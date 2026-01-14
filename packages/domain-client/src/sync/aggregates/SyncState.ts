/**
 * SyncState 聚合根 (Client)
 * 全局同步状态
 */

import { AggregateRoot } from '@dailyuse/utils';
import { SyncGlobalStatus } from '@dailyuse/contracts/sync';
import type { SyncStateClientDTO, SyncStateClient } from '@dailyuse/contracts/sync';

type StatusLabel = 'idle' | 'syncing' | 'error' | 'offline' | 'conflict';

/**
 * SyncState 聚合根
 *
 * 客户端全局同步状态表示
 */
export class SyncState extends AggregateRoot implements SyncStateClient {
  private _globalStatus: SyncGlobalStatus;
  private _currentDeviceId: string;
  private _currentDeviceName: string;
  private _activeProfileId?: string | null;
  private _activeProfileName?: string | null;
  private _currentSessionId?: string | null;
  private _statusLabel: StatusLabel;
  private _statusDescription: string;
  private _pendingChangesCount: number;
  private _unresolvedConflictsCount: number;
  private _lastSyncAt?: number | null;
  private _lastSyncAtFormatted?: string | null;
  private _lastSyncResult?: 'success' | 'failed' | 'partial' | null;
  private _isLocked: boolean;
  private _isOnline: boolean;
  private _otherDevicesCount: number;

  private constructor(params: {
    uuid: string;
    globalStatus: SyncGlobalStatus;
    currentDeviceId: string;
    currentDeviceName: string;
    activeProfileId?: string | null;
    activeProfileName?: string | null;
    currentSessionId?: string | null;
    statusLabel: StatusLabel;
    statusDescription: string;
    pendingChangesCount: number;
    unresolvedConflictsCount: number;
    lastSyncAt?: number | null;
    lastSyncAtFormatted?: string | null;
    lastSyncResult?: 'success' | 'failed' | 'partial' | null;
    isLocked: boolean;
    isOnline: boolean;
    otherDevicesCount: number;
  }) {
    super(params.uuid);
    this._globalStatus = params.globalStatus;
    this._currentDeviceId = params.currentDeviceId;
    this._currentDeviceName = params.currentDeviceName;
    this._activeProfileId = params.activeProfileId;
    this._activeProfileName = params.activeProfileName;
    this._currentSessionId = params.currentSessionId;
    this._statusLabel = params.statusLabel;
    this._statusDescription = params.statusDescription;
    this._pendingChangesCount = params.pendingChangesCount;
    this._unresolvedConflictsCount = params.unresolvedConflictsCount;
    this._lastSyncAt = params.lastSyncAt;
    this._lastSyncAtFormatted = params.lastSyncAtFormatted;
    this._lastSyncResult = params.lastSyncResult;
    this._isLocked = params.isLocked;
    this._isOnline = params.isOnline;
    this._otherDevicesCount = params.otherDevicesCount;
  }

  // ===== Getters =====

  override get uuid(): string {
    return this._uuid;
  }

  get globalStatus(): SyncGlobalStatus {
    return this._globalStatus;
  }

  get currentDeviceId(): string {
    return this._currentDeviceId;
  }

  get currentDeviceName(): string {
    return this._currentDeviceName;
  }

  get activeProfileId(): string | null | undefined {
    return this._activeProfileId;
  }

  get activeProfileName(): string | null | undefined {
    return this._activeProfileName;
  }

  get currentSessionId(): string | null | undefined {
    return this._currentSessionId;
  }

  get statusLabel(): StatusLabel {
    return this._statusLabel;
  }

  get statusDescription(): string {
    return this._statusDescription;
  }

  get pendingChangesCount(): number {
    return this._pendingChangesCount;
  }

  get unresolvedConflictsCount(): number {
    return this._unresolvedConflictsCount;
  }

  get lastSyncAt(): number | null | undefined {
    return this._lastSyncAt;
  }

  get lastSyncAtFormatted(): string | null | undefined {
    return this._lastSyncAtFormatted;
  }

  get lastSyncResult(): 'success' | 'failed' | 'partial' | null | undefined {
    return this._lastSyncResult;
  }

  get isLocked(): boolean {
    return this._isLocked;
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  get otherDevicesCount(): number {
    return this._otherDevicesCount;
  }

  // ===== 静态工厂方法 =====

  static fromClientDTO(dto: SyncStateClientDTO): SyncState {
    return new SyncState({
      uuid: dto.currentDeviceId ?? 'unknown', // 使用设备 ID 作为 uuid
      globalStatus: dto.globalStatus,
      currentDeviceId: dto.currentDeviceId ?? 'unknown',
      currentDeviceName: dto.currentDeviceName ?? 'Unknown Device',
      activeProfileId: dto.activeProfileId,
      activeProfileName: dto.activeProfileName,
      currentSessionId: dto.currentSessionId,
      statusLabel: dto.statusLabel,
      statusDescription: dto.statusDescription ?? '',
      pendingChangesCount: dto.pendingChangesCount,
      unresolvedConflictsCount: dto.unresolvedConflictsCount,
      lastSyncAt: dto.lastSyncAt,
      lastSyncAtFormatted: dto.lastSyncAtFormatted,
      lastSyncResult: dto.lastSyncResult,
      isLocked: dto.isLocked ?? false,
      isOnline: dto.isOnline,
      otherDevicesCount: dto.otherDevicesCount ?? 0,
    });
  }

  // ===== 接口方法 =====

  canSync(): boolean {
    return this._isOnline && !this._isLocked && this._activeProfileId != null;
  }

  isSyncing(): boolean {
    return this._statusLabel === 'syncing';
  }

  // ===== UI 辅助属性 =====

  /**
   * 状态标签显示文本
   */
  get statusLabelDisplay(): string {
    const map: Record<StatusLabel, string> = {
      idle: '空闲',
      syncing: '同步中',
      error: '错误',
      offline: '离线',
      conflict: '有冲突',
    };
    return map[this._statusLabel];
  }

  /**
   * 状态颜色
   */
  get statusColor(): string {
    const colorMap: Record<StatusLabel, string> = {
      idle: '#10b981',
      syncing: '#3b82f6',
      error: '#ef4444',
      offline: '#6b7280',
      conflict: '#f59e0b',
    };
    return colorMap[this._statusLabel];
  }

  /**
   * 状态图标
   */
  get statusIcon(): string {
    const iconMap: Record<StatusLabel, string> = {
      idle: '✅',
      syncing: '🔄',
      error: '❌',
      offline: '📴',
      conflict: '⚠️',
    };
    return iconMap[this._statusLabel];
  }

  /**
   * 网络状态显示
   */
  get networkStatusDisplay(): string {
    return this._isOnline ? '在线' : '离线';
  }

  /**
   * 网络状态颜色
   */
  get networkStatusColor(): string {
    return this._isOnline ? '#10b981' : '#6b7280';
  }

  /**
   * 待同步变更显示
   */
  get pendingChangesDisplay(): string {
    if (this._pendingChangesCount === 0) return '无待同步变更';
    return `${this._pendingChangesCount} 个待同步变更`;
  }

  /**
   * 是否有待同步变更
   */
  get hasPendingChanges(): boolean {
    return this._pendingChangesCount > 0;
  }

  /**
   * 其他设备显示
   */
  get otherDevicesDisplay(): string {
    if (this._otherDevicesCount === 0) return '无其他设备';
    return `${this._otherDevicesCount} 个其他设备`;
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
   * 是否有活动配置
   */
  get hasActiveProfile(): boolean {
    return this._activeProfileId != null;
  }

  /**
   * 是否有当前会话
   */
  get hasCurrentSession(): boolean {
    return this._currentSessionId != null;
  }

  // ===== DTO 转换 =====

  toClientDTO(): SyncStateClientDTO {
    return {
      globalStatus: this._globalStatus,
      currentDeviceId: this._currentDeviceId,
      currentDeviceName: this._currentDeviceName,
      activeProfileId: this._activeProfileId,
      activeProfileName: this._activeProfileName,
      currentSessionId: this._currentSessionId,
      statusLabel: this._statusLabel,
      statusDescription: this._statusDescription,
      pendingChangesCount: this._pendingChangesCount,
      unresolvedConflictsCount: this._unresolvedConflictsCount,
      lastSyncAt: this._lastSyncAt,
      lastSyncAtFormatted: this._lastSyncAtFormatted,
      lastSyncResult: this._lastSyncResult,
      isLocked: this._isLocked,
      isOnline: this._isOnline,
      otherDevicesCount: this._otherDevicesCount,
    };
  }
}
