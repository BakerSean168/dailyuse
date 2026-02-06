/**
 * ScheduleExecution Entity - Domain Client
 * 调度执行记录实体 - 领域客户端
 *
 * 【规范说明】
 * - 实现 ScheduleExecutionClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: ScheduleExecutionClientDTO): ScheduleExecution
 * - Instance toDTO(): ScheduleExecutionClientDTO
 */

import type {
  ScheduleExecutionClient,
  ScheduleExecutionClientDTO,
  ExecutionStatus,
} from '@dailyuse/contracts/schedule';
import { Entity } from '@dailyuse/utils';
import { ScheduleExecutionId, ScheduleTaskId } from '@dailyuse/domain-shared/schedule';

export class ScheduleExecution extends Entity<ScheduleExecutionId> implements ScheduleExecutionClient {
  // ================= 1. Backing Fields =================
  private _scheduleTaskId: ScheduleTaskId;
  private _executionTime: Date;
  private _status: ExecutionStatus;
  private _duration: number | null;
  private _result: Record<string, any> | null;
  private _error: string | null;
  private _retryCount: number;
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // UI 辅助属性
  private _executionTimeFormatted: string;
  private _statusDisplay: string;
  private _statusColor: string;
  private _durationFormatted: string;
  private _hasError: boolean;
  private _hasResult: boolean;
  private _resultSummary: string;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: ScheduleExecutionId;
    scheduleTaskId: ScheduleTaskId;
    executionTime: Date;
    status: ExecutionStatus;
    duration: number | null;
    result: Record<string, any> | null;
    error: string | null;
    retryCount: number;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    executionTimeFormatted: string;
    statusDisplay: string;
    statusColor: string;
    durationFormatted: string;
    hasError: boolean;
    hasResult: boolean;
    resultSummary: string;
  }) {
    super(params.id);
    this._scheduleTaskId = params.scheduleTaskId;
    this._executionTime = params.executionTime;
    this._status = params.status;
    this._duration = params.duration;
    this._result = params.result;
    this._error = params.error;
    this._retryCount = params.retryCount;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
    this._executionTimeFormatted = params.executionTimeFormatted;
    this._statusDisplay = params.statusDisplay;
    this._statusColor = params.statusColor;
    this._durationFormatted = params.durationFormatted;
    this._hasError = params.hasError;
    this._hasResult = params.hasResult;
    this._resultSummary = params.resultSummary;
  }

  // ================= 3. Getters =================
  get scheduleTaskId(): ScheduleTaskId {
    return this._scheduleTaskId;
  }

  get executionTime(): Date {
    return this._executionTime;
  }

  get status(): ExecutionStatus {
    return this._status;
  }

  get duration(): number | null {
    return this._duration;
  }

  get result(): Record<string, any> | null {
    return this._result ? { ...this._result } : null;
  }

  get error(): string | null {
    return this._error;
  }

  get retryCount(): number {
    return this._retryCount;
  }

  get version(): number {
    return this._version;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get deletedAt(): Date | null {
    return this._deletedAt;
  }

  // UI 辅助属性
  get executionTimeFormatted(): string {
    return this._executionTimeFormatted;
  }

  get statusDisplay(): string {
    return this._statusDisplay;
  }

  get statusColor(): string {
    return this._statusColor;
  }

  get durationFormatted(): string {
    return this._durationFormatted;
  }

  get hasError(): boolean {
    return this._hasError;
  }

  get hasResult(): boolean {
    return this._hasResult;
  }

  get resultSummary(): string {
    return this._resultSummary;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  get isSuccess(): boolean {
    return this._status === 'Success';
  }

  get isFailed(): boolean {
    return this._status === 'Failed';
  }

  get isTimeout(): boolean {
    return this._status === 'Timeout';
  }

  get isSkipped(): boolean {
    return this._status === 'Skipped';
  }

  get isRetrying(): boolean {
    return this._status === 'Retrying';
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: ScheduleExecutionClientDTO): ScheduleExecution {
    return new ScheduleExecution({
      id: ScheduleExecutionId.of(dto.id),
      scheduleTaskId: ScheduleTaskId.of(dto.scheduleTaskId),
      executionTime: new Date(dto.executionTime),
      status: dto.status,
      duration: dto.duration,
      result: dto.result,
      error: dto.error,
      retryCount: dto.retryCount,
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      executionTimeFormatted: dto.executionTimeFormatted,
      statusDisplay: dto.statusDisplay,
      statusColor: dto.statusColor,
      durationFormatted: dto.durationFormatted,
      hasError: dto.hasError,
      hasResult: dto.hasResult,
      resultSummary: dto.resultSummary,
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): ScheduleExecutionClientDTO {
    return {
      id: String(this.id),
      scheduleTaskId: String(this._scheduleTaskId),
      executionTime: this._executionTime.getTime(),
      status: this._status,
      duration: this._duration,
      result: this._result ? { ...this._result } : null,
      error: this._error,
      retryCount: this._retryCount,
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      executionTimeFormatted: this._executionTimeFormatted,
      statusDisplay: this._statusDisplay,
      statusColor: this._statusColor,
      durationFormatted: this._durationFormatted,
      hasError: this._hasError,
      hasResult: this._hasResult,
      resultSummary: this._resultSummary,
    };
  }
}
