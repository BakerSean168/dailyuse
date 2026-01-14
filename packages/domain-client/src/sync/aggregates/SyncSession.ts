/**
 * SyncSession 聚合根 (Client)
 * 同步会话
 */

import { AggregateRoot } from '@dailyuse/utils';
import {
  SyncSessionStatus,
  SyncDirection,
  SyncStrategy,
  SyncTriggerType,
  type SyncSessionClientDTO,
  type SyncSessionStatsDTO,
  type SyncSessionClient,
} from '@dailyuse/contracts/sync';
import { SyncSessionStats } from '../value-objects/SyncSessionStats';

interface SessionError {
  code: string;
  message: string;
}

/**
 * SyncSession 聚合根
 *
 * 客户端同步会话表示
 */
export class SyncSession extends AggregateRoot implements SyncSessionClient {
  private _profileId: string;
  private _status: SyncSessionStatus;
  private _direction: SyncDirection;
  private _strategy: SyncStrategy;
  private _triggerType: SyncTriggerType;
  private _triggerDeviceName: string;
  private _progress: number;
  private _currentEntityDesc?: string;
  private _conflictCount: number;
  private _processedCount: number;
  private _totalCount: number;
  private _statistics?: SyncSessionStats | null;
  private _error?: SessionError | null;
  private _canRetry: boolean;
  private _createdAt: number;
  private _startedAt?: number | null;
  private _completedAt?: number | null;
  private _estimatedTimeRemaining?: number | null;

  private constructor(params: {
    uuid: string;
    profileId: string;
    status: SyncSessionStatus;
    direction: SyncDirection;
    strategy: SyncStrategy;
    triggerType: SyncTriggerType;
    triggerDeviceName: string;
    progress: number;
    currentEntityDesc?: string;
    conflictCount: number;
    processedCount: number;
    totalCount: number;
    statistics?: SyncSessionStats | null;
    error?: SessionError | null;
    canRetry: boolean;
    createdAt: number;
    startedAt?: number | null;
    completedAt?: number | null;
    estimatedTimeRemaining?: number | null;
  }) {
    super(params.uuid);
    this._profileId = params.profileId;
    this._status = params.status;
    this._direction = params.direction;
    this._strategy = params.strategy;
    this._triggerType = params.triggerType;
    this._triggerDeviceName = params.triggerDeviceName;
    this._progress = params.progress;
    this._currentEntityDesc = params.currentEntityDesc;
    this._conflictCount = params.conflictCount;
    this._processedCount = params.processedCount;
    this._totalCount = params.totalCount;
    this._statistics = params.statistics;
    this._error = params.error;
    this._canRetry = params.canRetry;
    this._createdAt = params.createdAt;
    this._startedAt = params.startedAt;
    this._completedAt = params.completedAt;
    this._estimatedTimeRemaining = params.estimatedTimeRemaining;
  }

  // ===== Getters =====

  override get uuid(): string {
    return this._uuid;
  }

  get profileId(): string {
    return this._profileId;
  }

  get status(): SyncSessionStatus {
    return this._status;
  }

  get direction(): SyncDirection {
    return this._direction;
  }

  get strategy(): SyncStrategy {
    return this._strategy;
  }

  get triggerType(): SyncTriggerType {
    return this._triggerType;
  }

  get triggerDeviceName(): string {
    return this._triggerDeviceName;
  }

  get progress(): number {
    return this._progress;
  }

  get currentEntityDesc(): string | undefined {
    return this._currentEntityDesc;
  }

  get conflictCount(): number {
    return this._conflictCount;
  }

  get processedCount(): number {
    return this._processedCount;
  }

  get totalCount(): number {
    return this._totalCount;
  }

  get statistics(): SyncSessionStats | null | undefined {
    return this._statistics;
  }

  get error(): SessionError | null | undefined {
    return this._error;
  }

  get canRetry(): boolean {
    return this._canRetry;
  }

  get createdAt(): number {
    return this._createdAt;
  }

  get startedAt(): number | null | undefined {
    return this._startedAt;
  }

  get completedAt(): number | null | undefined {
    return this._completedAt;
  }

  get estimatedTimeRemaining(): number | null | undefined {
    return this._estimatedTimeRemaining;
  }

  // ===== 静态工厂方法 =====

  static fromClientDTO(dto: SyncSessionClientDTO): SyncSession {
    return new SyncSession({
      uuid: dto.uuid,
      profileId: dto.profileId,
      status: dto.status,
      direction: dto.direction,
      strategy: dto.strategy,
      triggerType: dto.triggerType,
      triggerDeviceName: dto.triggerDeviceName,
      progress: dto.progress,
      currentEntityDesc: dto.currentEntityDesc,
      conflictCount: dto.conflictCount,
      processedCount: dto.processedCount,
      totalCount: dto.totalCount,
      statistics: dto.statistics ? SyncSessionStats.fromDTO(dto.statistics) : null,
      error: dto.error,
      canRetry: dto.canRetry,
      createdAt: dto.createdAt,
      startedAt: dto.startedAt,
      completedAt: dto.completedAt,
      estimatedTimeRemaining: dto.estimatedTimeRemaining,
    });
  }

  // ===== 接口方法 =====

  isInProgress(): boolean {
    return [
      SyncSessionStatus.PENDING,
      SyncSessionStatus.COLLECTING,
      SyncSessionStatus.SYNCING,
      SyncSessionStatus.CONFLICTED,
    ].includes(this._status);
  }

  isCompleted(): boolean {
    return this._status === SyncSessionStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this._status === SyncSessionStatus.FAILED;
  }

  // ===== UI 辅助属性 =====

  /**
   * 状态显示文本
   */
  get statusDisplay(): string {
    const map: Record<SyncSessionStatus, string> = {
      [SyncSessionStatus.PENDING]: '准备中',
      [SyncSessionStatus.COLLECTING]: '收集变更',
      [SyncSessionStatus.SYNCING]: '同步中',
      [SyncSessionStatus.CONFLICTED]: '有冲突',
      [SyncSessionStatus.COMPLETED]: '已完成',
      [SyncSessionStatus.FAILED]: '失败',
      [SyncSessionStatus.CANCELLED]: '已取消',
    };
    return map[this._status];
  }

  /**
   * 状态颜色
   */
  get statusColor(): string {
    const colorMap: Record<SyncSessionStatus, string> = {
      [SyncSessionStatus.PENDING]: '#6b7280',
      [SyncSessionStatus.COLLECTING]: '#3b82f6',
      [SyncSessionStatus.SYNCING]: '#3b82f6',
      [SyncSessionStatus.CONFLICTED]: '#f59e0b',
      [SyncSessionStatus.COMPLETED]: '#10b981',
      [SyncSessionStatus.FAILED]: '#ef4444',
      [SyncSessionStatus.CANCELLED]: '#6b7280',
    };
    return colorMap[this._status];
  }

  /**
   * 方向显示文本
   */
  get directionDisplay(): string {
    const map: Record<SyncDirection, string> = {
      [SyncDirection.PUSH]: '上传',
      [SyncDirection.PULL]: '下载',
      [SyncDirection.BIDIRECTIONAL]: '双向',
    };
    return map[this._direction];
  }

  /**
   * 策略显示文本
   */
  get strategyDisplay(): string {
    const map: Record<SyncStrategy, string> = {
      [SyncStrategy.FULL]: '完整',
      [SyncStrategy.INCREMENTAL]: '增量',
      [SyncStrategy.AUTO]: '自动',
    };
    return map[this._strategy];
  }

  /**
   * 触发方式显示文本
   */
  get triggerTypeDisplay(): string {
    const map: Record<SyncTriggerType, string> = {
      [SyncTriggerType.MANUAL]: '手动',
      [SyncTriggerType.AUTO_SCHEDULED]: '定时',
      [SyncTriggerType.ON_CHANGE]: '变更触发',
      [SyncTriggerType.ON_STARTUP]: '启动',
      [SyncTriggerType.ON_NETWORK_RESTORE]: '网络恢复',
    };
    return map[this._triggerType];
  }

  /**
   * 进度百分比显示
   */
  get progressDisplay(): string {
    return `${Math.round(this._progress * 100)}%`;
  }

  /**
   * 处理进度显示
   */
  get processedDisplay(): string {
    return `${this._processedCount}/${this._totalCount}`;
  }

  /**
   * 预计剩余时间显示
   */
  get estimatedTimeRemainingDisplay(): string | null {
    if (this._estimatedTimeRemaining == null) return null;
    const seconds = Math.floor(this._estimatedTimeRemaining / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `约 ${minutes} 分钟`;
    }
    return `约 ${seconds} 秒`;
  }

  /**
   * 创建时间格式化
   */
  get createdAtFormatted(): string {
    return new Date(this._createdAt).toLocaleString();
  }

  /**
   * 开始时间格式化
   */
  get startedAtFormatted(): string | null {
    return this._startedAt ? new Date(this._startedAt).toLocaleString() : null;
  }

  /**
   * 完成时间格式化
   */
  get completedAtFormatted(): string | null {
    return this._completedAt ? new Date(this._completedAt).toLocaleString() : null;
  }

  /**
   * 耗时显示
   */
  get durationDisplay(): string | null {
    if (!this._startedAt) return null;
    const endTime = this._completedAt ?? Date.now();
    const duration = endTime - this._startedAt;
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}分${seconds % 60}秒`;
    }
    return `${seconds}秒`;
  }

  /**
   * 是否有冲突
   */
  get hasConflicts(): boolean {
    return this._conflictCount > 0;
  }

  /**
   * 是否有错误
   */
  get hasError(): boolean {
    return this._error != null;
  }

  /**
   * 错误消息
   */
  get errorMessage(): string | null {
    return this._error?.message ?? null;
  }

  // ===== DTO 转换 =====

  toClientDTO(): SyncSessionClientDTO {
    return {
      uuid: this.uuid,
      profileId: this._profileId,
      status: this._status,
      direction: this._direction,
      strategy: this._strategy,
      triggerType: this._triggerType,
      triggerDeviceName: this._triggerDeviceName,
      progress: this._progress,
      currentEntityDesc: this._currentEntityDesc,
      conflictCount: this._conflictCount,
      processedCount: this._processedCount,
      totalCount: this._totalCount,
      statistics: this._statistics?.toDTO() ?? null,
      error: this._error,
      canRetry: this._canRetry,
      createdAt: this._createdAt,
      startedAt: this._startedAt,
      completedAt: this._completedAt,
      estimatedTimeRemaining: this._estimatedTimeRemaining,
    };
  }
}
