/**
 * ScheduleExecution Entity - Domain Client
 * 调度执行记录实体 - 领域客户端
 *
 * 【规范说明】
 * - 实现 ScheduleExecutionClient 接口
 * - Private constructor with props object
 * - Public getters via this._props.xxx
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

// 内部状态接口
interface ScheduleExecutionState {
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
}

export class ScheduleExecution extends Entity<ScheduleExecutionId> implements ScheduleExecutionClient {
  private readonly _props: ScheduleExecutionState;

  private constructor(props: ScheduleExecutionState) {
    super(props.id);
    this._props = props;
  }

  // ================= Getters =================
  get scheduleTaskId(): ScheduleTaskId {
    return this._props.scheduleTaskId;
  }

  get executionTime(): Date {
    return this._props.executionTime;
  }

  get status(): ExecutionStatus {
    return this._props.status;
  }

  get duration(): number | null {
    return this._props.duration;
  }

  get result(): Record<string, any> | null {
    return this._props.result ? { ...this._props.result } : null;
  }

  get error(): string | null {
    return this._props.error;
  }

  get retryCount(): number {
    return this._props.retryCount;
  }

  get version(): number {
    return this._props.version;
  }

  get createdAt(): Date {
    return this._props.createdAt;
  }

  get updatedAt(): Date {
    return this._props.updatedAt;
  }

  get deletedAt(): Date | null {
    return this._props.deletedAt;
  }

  // UI 辅助属性
  get executionTimeFormatted(): string {
    return this._props.executionTimeFormatted;
  }

  get statusDisplay(): string {
    return this._props.statusDisplay;
  }

  get statusColor(): string {
    return this._props.statusColor;
  }

  get durationFormatted(): string {
    return this._props.durationFormatted;
  }

  get hasError(): boolean {
    return this._props.hasError;
  }

  get hasResult(): boolean {
    return this._props.hasResult;
  }

  get resultSummary(): string {
    return this._props.resultSummary;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
  }

  get isSuccess(): boolean {
    return this._props.status === 'Success';
  }

  get isFailed(): boolean {
    return this._props.status === 'Failed';
  }

  get isTimeout(): boolean {
    return this._props.status === 'Timeout';
  }

  get isSkipped(): boolean {
    return this._props.status === 'Skipped';
  }

  get isRetrying(): boolean {
    return this._props.status === 'Retrying';
  }

  // ================= Factory Methods =================
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

  // ================= DTO Conversion =================
  public toDTO(): ScheduleExecutionClientDTO {
    return {
      id: String(this._props.id),
      scheduleTaskId: String(this._props.scheduleTaskId),
      executionTime: this._props.executionTime.getTime(),
      status: this._props.status,
      duration: this._props.duration,
      result: this._props.result ? { ...this._props.result } : null,
      error: this._props.error,
      retryCount: this._props.retryCount,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      executionTimeFormatted: this._props.executionTimeFormatted,
      statusDisplay: this._props.statusDisplay,
      statusColor: this._props.statusColor,
      durationFormatted: this._props.durationFormatted,
      hasError: this._props.hasError,
      hasResult: this._props.hasResult,
      resultSummary: this._props.resultSummary,
    };
  }
}
