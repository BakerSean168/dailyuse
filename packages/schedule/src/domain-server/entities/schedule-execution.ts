/**
 * ScheduleExecution 实体实现
 * 执行记录实体
 *
 * DDD 实体职责：
 * - 管理单次执行记录
 * - 执行状态追踪
 * - 错误信息管理
 */

import { Entity, generateUUID } from '@dailyuse/utils';
import type {
  ScheduleExecutionClientDTO,
  ScheduleExecutionServerDTO,
} from '@dailyuse/contracts/schedule';
import { ExecutionStatus } from '@dailyuse/contracts/schedule';

/** Domain state interface for the ScheduleExecution entity */
export interface ScheduleExecutionState {
  id: string;
  taskId: string;
  executionTime: Date;
  status: ExecutionStatus;
  duration: number | null;
  result: Record<string, any> | null;
  error: string | null;
  retryCount: number;
  createdAt: Date;
}

/**
 * ScheduleExecution 实体
 */
export class ScheduleExecution extends Entity<string> {
  // ===== 私有字段 =====
  private _taskId: string;
  private _executionTime: Date;
  private _status: ExecutionStatus;
  private _duration: number | null;
  private _result: Record<string, any> | null;
  private _error: string | null;
  private _retryCount: number;
  private _createdAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(state: ScheduleExecutionState) {
    super(state.id);
    this._taskId = state.taskId;
    this._executionTime = state.executionTime;
    this._status = state.status;
    this._duration = state.duration;
    this._result = state.result;
    this._error = state.error;
    this._retryCount = state.retryCount;
    this._createdAt = state.createdAt;
  }

  // ===== Getter 属性 =====

  public get taskId(): string {
    return this._taskId;
  }
  public get executionTime(): number {
    return this._executionTime.getTime();
  }
  public get status(): ExecutionStatus {
    return this._status;
  }
  public get duration(): number | null {
    return this._duration;
  }
  public get result(): Record<string, any> | null {
    return this._result;
  }
  public get error(): string | null {
    return this._error;
  }
  public get retryCount(): number {
    return this._retryCount;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }

  // ===== 业务方法 =====

  /**
   * 标记执行成功
   */
  public markSuccess(duration: number, result?: Record<string, any>): void {
    this._status = ExecutionStatus.Success;
    this._duration = duration;
    if (result) {
      this._result = result;
    }
    this._error = null;
  }

  /**
   * 标记执行失败
   */
  public markFailed(error: string, duration?: number): void {
    this._status = ExecutionStatus.Failed;
    this._error = error;
    if (duration !== undefined) {
      this._duration = duration;
    }
  }

  /**
   * 标记执行超时
   */
  public markTimeout(duration: number): void {
    this._status = ExecutionStatus.Timeout;
    this._duration = duration;
    this._error = 'Execution timeout';
  }

  /**
   * 标记执行跳过
   */
  public markSkipped(reason: string): void {
    this._status = ExecutionStatus.Skipped;
    this._error = reason;
    this._duration = 0;
  }

  /**
   * 增加重试次数
   */
  public incrementRetry(): void {
    this._retryCount += 1;
    this._status = ExecutionStatus.Retrying;
  }

  /**
   * 设置执行结果
   */
  public setResult(result: Record<string, any>): void {
    this._result = result;
  }

  /**
   * 设置错误信息
   */
  public setError(error: string): void {
    this._error = error;
  }

  /**
   * 检查是否成功
   */
  public isSuccess(): boolean {
    return this._status === ExecutionStatus.Success;
  }

  /**
   * 检查是否失败
   */
  public isFailed(): boolean {
    return this._status === ExecutionStatus.Failed;
  }

  /**
   * 检查是否超时
   */
  public isTimeout(): boolean {
    return this._status === ExecutionStatus.Timeout;
  }

  /**
   * 检查是否跳过
   */
  public isSkipped(): boolean {
    return this._status === ExecutionStatus.Skipped;
  }

  // ===== 转换方法 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): ScheduleExecutionServerDTO {
    return {
      id: this.id,
      taskId: this._taskId,
      executionTime: this._executionTime.getTime(),
      status: this._status,
      duration: this._duration,
      result: this._result ? { ...this._result } : null,
      error: this._error,
      retryCount: this._retryCount,
      createdAt: this._createdAt.getTime(),
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): ScheduleExecutionClientDTO {
    return {
      id: this.id as ScheduleExecutionClientDTO['id'],
      scheduleTaskId: this._taskId as ScheduleExecutionClientDTO['scheduleTaskId'],
      executionTime: this._executionTime.getTime(),
      status: this._status,
      duration: this._duration,
      result: this._result ? { ...this._result } : null,
      error: this._error,
      retryCount: this._retryCount,
      version: 1,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._createdAt.getTime(),
      deletedAt: null,
      // UI 辅助属性
      executionTimeFormatted: this._executionTime.toLocaleString('zh-CN'),
      statusDisplay: this._getStatusText(),
      statusColor: this._getStatusColor(),
      durationFormatted: this._formatDuration(),
      hasError: this._error !== null,
      hasResult: this._result !== null,
      resultSummary: this._getResultSummary(),
    };
  }

  /**
   * 转换为 DTO（内部使用，兼容旧代码）
   */
  public toDTO(): ScheduleExecutionServerDTO {
    return this.toServerDTO();
  }

  // ===== 私有辅助方法 =====

  private _getStatusText(): string {
    switch (this._status) {
      case ExecutionStatus.Success:
        return '执行成功';
      case ExecutionStatus.Failed:
        return '执行失败';
      case ExecutionStatus.Timeout:
        return '执行超时';
      case ExecutionStatus.Skipped:
        return '已跳过';
      case ExecutionStatus.Retrying:
        return '重试中';
      default:
        return '未知状态';
    }
  }

  private _getStatusColor(): string {
    switch (this._status) {
      case ExecutionStatus.Success:
        return 'green';
      case ExecutionStatus.Failed:
        return 'red';
      case ExecutionStatus.Timeout:
        return 'orange';
      case ExecutionStatus.Skipped:
        return 'gray';
      case ExecutionStatus.Retrying:
        return 'blue';
      default:
        return 'gray';
    }
  }

  private _formatDuration(): string {
    if (this._duration === null) return '-';
    if (this._duration < 1000) return `${this._duration} 毫秒`;
    return `${(this._duration / 1000).toFixed(2)} 秒`;
  }

  private _getResultSummary(): string {
    if (!this._result) return '空';
    const keys = Object.keys(this._result);
    return `${keys.length} 个字段`;
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建新的执行记录
   */
  public static create(params: {
    taskId: string;
    executionTime: number;
    status?: ExecutionStatus;
  }): ScheduleExecution {
    return new ScheduleExecution({
      id: generateUUID(),
      taskId: params.taskId,
      executionTime: new Date(params.executionTime),
      status: params.status ?? ExecutionStatus.Success,
      duration: null,
      result: null,
      error: null,
      retryCount: 0,
      createdAt: new Date(),
    });
  }

  /**
   * 从已有状态加载实体（用于持久化重建）
   */
  public static load(state: ScheduleExecutionState): ScheduleExecution {
    return new ScheduleExecution(state);
  }

  /**
   * 从 DTO 创建实体 (兼容旧代码)
   */
  public static fromDTO(dto: any): ScheduleExecution {
    return new ScheduleExecution({
      id: dto.id ?? generateUUID(),
      taskId: dto.taskId,
      executionTime: new Date(dto.executionTime),
      status: dto.status,
      duration: dto.duration ?? null,
      result: dto.result ?? null,
      error: dto.error ?? null,
      retryCount: dto.retryCount ?? 0,
      createdAt: new Date(dto.createdAt ?? Date.now()),
    });
  }
}
