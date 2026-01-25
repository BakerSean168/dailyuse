/**
 * SyncSession 聚合根
 * 同步会话
 */

import { AggregateRoot } from '@dailyuse/utils';
import {
  SyncSessionStatus,
  SyncDirection,
  SyncStrategy,
  SyncTriggerType,
  type SyncSessionServerDTO,
  type SyncSessionClientDTO,
  type SyncSessionPersistenceDTO,
  type DeviceInfoDTO,
  type SyncVersionServerDTO,
  type SyncSessionStatsDTO,
  type SyncConflictServerDTO,
} from '@dailyuse/contracts/sync';
import { SyncConflict } from '../entities/SyncConflict';
import { SyncVersion } from '../value-objects/SyncVersion';
import { SyncSessionStats } from '../value-objects/SyncSessionStats';

interface SessionError {
  code: string;
  message: string;
  details?: unknown;
  stack?: string;
}

/**
 * SyncSession 聚合根
 *
 * 表示一次同步会话
 */
export class SyncSession extends AggregateRoot {
  private _profileId: string;
  private _status: SyncSessionStatus;
  private _direction: SyncDirection;
  private _strategy: SyncStrategy;
  private _triggerType: SyncTriggerType;
  private _triggerDevice: DeviceInfoDTO;
  private _startVersion: SyncVersionServerDTO;
  private _endVersion?: SyncVersionServerDTO | null;
  private _localSnapshotId?: string | null;
  private _remoteSnapshotId?: string | null;
  private _conflicts: SyncConflict[];
  private _statistics?: SyncSessionStatsDTO | null;
  private _error?: SessionError | null;
  private _canRetry: boolean;
  private _retryCount: number;
  private _createdAt: Date;
  private _startedAt?: number | null;
  private _completedAt?: number | null;
  private _updatedAt: Date;

  private constructor(params: {
    uuid: string;
    profileId: string;
    status: SyncSessionStatus;
    direction: SyncDirection;
    strategy: SyncStrategy;
    triggerType: SyncTriggerType;
    triggerDevice: DeviceInfoDTO;
    startVersion: SyncVersionServerDTO;
    endVersion?: SyncVersionServerDTO | null;
    localSnapshotId?: string | null;
    remoteSnapshotId?: string | null;
    conflicts: SyncConflict[];
    statistics?: SyncSessionStatsDTO | null;
    error?: SessionError | null;
    canRetry: boolean;
    retryCount: number;
    createdAt: number;
    startedAt?: number | null;
    completedAt?: number | null;
    updatedAt: number;
  }) {
    super(params.uuid);
    this._profileId = params.profileId;
    this._status = params.status;
    this._direction = params.direction;
    this._strategy = params.strategy;
    this._triggerType = params.triggerType;
    this._triggerDevice = params.triggerDevice;
    this._startVersion = params.startVersion;
    this._endVersion = params.endVersion;
    this._localSnapshotId = params.localSnapshotId;
    this._remoteSnapshotId = params.remoteSnapshotId;
    this._conflicts = params.conflicts;
    this._statistics = params.statistics;
    this._error = params.error;
    this._canRetry = params.canRetry;
    this._retryCount = params.retryCount;
    this._createdAt = params.createdAt;
    this._startedAt = params.startedAt;
    this._completedAt = params.completedAt;
    this._updatedAt = params.updatedAt;
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

  get triggerDevice(): DeviceInfoDTO {
    return this._triggerDevice;
  }

  get conflicts(): ReadonlyArray<SyncConflict> {
    return this._conflicts;
  }

  get statistics(): SyncSessionStatsDTO | null | undefined {
    return this._statistics;
  }

  get error(): SessionError | null | undefined {
    return this._error;
  }

  get canRetry(): boolean {
    return this._canRetry;
  }

  get retryCount(): number {
    return this._retryCount;
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

  // ===== 静态工厂方法 =====

  /**
   * 创建新的同步会话
   */
  static create(params: {
    profileId: string;
    direction: SyncDirection;
    strategy: SyncStrategy;
    triggerType: SyncTriggerType;
    triggerDevice: DeviceInfoDTO;
    startVersion: SyncVersionServerDTO;
  }): SyncSession {
    const now = Date.now();
    return new SyncSession({
      uuid: AggregateRoot.generateUUID(),
      profileId: params.profileId,
      status: SyncSessionStatus.PENDING,
      direction: params.direction,
      strategy: params.strategy,
      triggerType: params.triggerType,
      triggerDevice: params.triggerDevice,
      startVersion: params.startVersion,
      conflicts: [],
      canRetry: true,
      retryCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 从 ServerDTO 重建
   */
  static fromServerDTO(dto: SyncSessionServerDTO): SyncSession {
    return new SyncSession({
      uuid: dto.uuid,
      profileId: dto.profileId,
      status: dto.status,
      direction: dto.direction,
      strategy: dto.strategy,
      triggerType: dto.triggerType,
      triggerDevice: dto.triggerDevice,
      startVersion: dto.startVersion,
      endVersion: dto.endVersion,
      localSnapshotId: dto.localSnapshotId,
      remoteSnapshotId: dto.remoteSnapshotId,
      conflicts: (dto.conflicts ?? []).map(SyncConflict.fromServerDTO),
      statistics: dto.statistics,
      error: dto.error,
      canRetry: dto.canRetry,
      retryCount: dto.retryCount,
      createdAt: new Date(dto.createdAt),
      startedAt: dto.startedAt,
      completedAt: dto.completedAt,
      updatedAt: new Date(dto.updatedAt),
    });
  }

  /**
   * 从 PersistenceDTO 重建（不包含关联的 conflicts）
   */
  static fromPersistenceDTO(dto: SyncSessionPersistenceDTO): SyncSession {
    return new SyncSession({
      uuid: dto.uuid,
      profileId: dto.profileId,
      status: dto.status as SyncSessionStatus,
      direction: dto.direction as SyncDirection,
      strategy: dto.strategy as SyncStrategy,
      triggerType: dto.triggerType as SyncTriggerType,
      triggerDevice: JSON.parse(dto.triggerDeviceJson),
      startVersion: JSON.parse(dto.startVersionJson),
      endVersion: dto.endVersionJson ? JSON.parse(dto.endVersionJson) : null,
      localSnapshotId: dto.localSnapshotId,
      remoteSnapshotId: dto.remoteSnapshotId,
      conflicts: [], // Conflicts loaded separately
      statistics: dto.statisticsJson ? JSON.parse(dto.statisticsJson) : null,
      error: dto.errorJson ? JSON.parse(dto.errorJson) : null,
      canRetry: dto.canRetry,
      retryCount: dto.retryCount,
      createdAt: new Date(dto.createdAt),
      startedAt: dto.startedAt,
      completedAt: dto.completedAt,
      updatedAt: new Date(dto.updatedAt),
    });
  }

  // ===== 业务方法 =====

  /**
   * 开始同步
   */
  start(): void {
    if (this._status !== SyncSessionStatus.PENDING) {
      throw new Error('SyncSession: can only start a pending session');
    }
    this._status = SyncSessionStatus.COLLECTING;
    this._startedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * 进入同步阶段
   */
  startSyncing(): void {
    if (this._status !== SyncSessionStatus.COLLECTING) {
      throw new Error('SyncSession: must be in collecting state');
    }
    this._status = SyncSessionStatus.SYNCING;
    this._updatedAt = new Date();
  }

  /**
   * 添加冲突
   */
  addConflict(conflict: SyncConflict): void {
    this._conflicts.push(conflict);
    if (this._status === SyncSessionStatus.SYNCING) {
      this._status = SyncSessionStatus.CONFLICTED;
    }
    this._updatedAt = new Date();
  }

  /**
   * 完成同步（成功）
   */
  complete(endVersion: SyncVersionServerDTO, statistics: SyncSessionStatsDTO): void {
    this._status = SyncSessionStatus.COMPLETED;
    this._endVersion = endVersion;
    this._statistics = statistics;
    this._completedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * 完成同步（失败）
   */
  fail(error: SessionError, canRetry: boolean = true): void {
    this._status = SyncSessionStatus.FAILED;
    this._error = error;
    this._canRetry = canRetry;
    this._completedAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * 取消同步
   */
  cancel(): void {
    if (this._status === SyncSessionStatus.COMPLETED || this._status === SyncSessionStatus.FAILED) {
      throw new Error('SyncSession: cannot cancel a finished session');
    }
    this._status = SyncSessionStatus.CANCELLED;
    this._completedAt = new Date();
    this._updatedAt = new Date();
  }

  // ===== 查询方法 =====

  /**
   * 是否正在进行
   */
  get isInProgress(): boolean {
    return (
      this._status === SyncSessionStatus.COLLECTING ||
      this._status === SyncSessionStatus.SYNCING ||
      this._status === SyncSessionStatus.CONFLICTED
    );
  }

  /**
   * 是否已完成
   */
  get isFinished(): boolean {
    return (
      this._status === SyncSessionStatus.COMPLETED ||
      this._status === SyncSessionStatus.FAILED ||
      this._status === SyncSessionStatus.CANCELLED
    );
  }

  /**
   * 是否成功
   */
  get isSuccessful(): boolean {
    return this._status === SyncSessionStatus.COMPLETED;
  }

  /**
   * 是否有未解决的冲突
   */
  get hasUnresolvedConflicts(): boolean {
    return this._conflicts.some((c) => c.isPending);
  }

  // ===== DTO 转换 =====

  toServerDTO(): SyncSessionServerDTO {
    return {
      uuid: this.uuid,
      profileId: this._profileId,
      status: this._status,
      direction: this._direction,
      strategy: this._strategy,
      triggerType: this._triggerType,
      triggerDevice: this._triggerDevice,
      startVersion: this._startVersion,
      endVersion: this._endVersion,
      localSnapshotId: this._localSnapshotId,
      remoteSnapshotId: this._remoteSnapshotId,
      conflicts: this._conflicts.map((c) => c.toServerDTO()),
      statistics: this._statistics,
      error: this._error,
      canRetry: this._canRetry,
      retryCount: this._retryCount,
      createdAt: new Date(this._createdAt),
      startedAt: this._startedAt,
      completedAt: this._completedAt,
      updatedAt: new Date(this._updatedAt),
    };
  }

  toClientDTO(): SyncSessionClientDTO {
    return {
      uuid: this.uuid,
      profileId: this._profileId,
      status: this._status,
      direction: this._direction,
      strategy: this._strategy,
      triggerType: this._triggerType,
      triggerDeviceName: this._triggerDevice.deviceName,
      progress: 0,
      conflictCount: this._conflicts.length,
      processedCount: this._statistics?.successCount ?? 0,
      totalCount: this._statistics?.totalEntities ?? 0,
      statistics: this._statistics,
      error: this._error ? { code: this._error.code, message: this._error.message } : null,
      canRetry: this._canRetry,
      createdAt: new Date(this._createdAt),
      startedAt: this._startedAt,
      completedAt: this._completedAt,
    };
  }

  toPersistenceDTO(): SyncSessionPersistenceDTO {
    return {
      uuid: this.uuid,
      profileId: this._profileId,
      status: this._status,
      direction: this._direction,
      strategy: this._strategy,
      triggerType: this._triggerType,
      triggerDeviceJson: JSON.stringify(this._triggerDevice),
      startVersionJson: JSON.stringify(this._startVersion),
      endVersionJson: this._endVersion ? JSON.stringify(this._endVersion) : null,
      localSnapshotId: this._localSnapshotId ?? null,
      remoteSnapshotId: this._remoteSnapshotId ?? null,
      statisticsJson: this._statistics ? JSON.stringify(this._statistics) : null,
      errorJson: this._error ? JSON.stringify(this._error) : null,
      canRetry: this._canRetry,
      retryCount: this._retryCount,
      createdAt: new Date(this._createdAt),
      startedAt: this._startedAt ? new Date(this._startedAt) : null,
      completedAt: this._completedAt ? new Date(this._completedAt) : null,
      updatedAt: new Date(this._updatedAt),
    };
  }
}
