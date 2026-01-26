/**
 * ScheduleExecution 实体实现
 * 执行记录实体
 *
 * DDD 实体职责：
 * - 管理单次执行记录
 * - 执行状态追踪
 * - 错误信息管理
 */

import { Entity } from '@dailyuse/utils';
import type {
  ScheduleExecutionClientDTO,
  ScheduleExecutionPersistenceDTO,
  ScheduleExecutionServer,
  ScheduleExecutionServerDTO,
} from '@dailyuse/contracts/schedule';
import { ExecutionStatus } from '@dailyuse/contracts/schedule';

/**
 * ScheduleExecution 实体
 */
export class ScheduleExecution extends Entity implements ScheduleExecutionServer {
  // ===== 私有字段 =====
  private _taskUuid: string;
  private _executionTime: number;
  private _status: ExecutionStatus;
  private _duration: number | null;
  private _result: Record<string, any> | null;
  private _error: string | null;
  private _retryCount: number;
  private _createdAt: Date;

  // ===== 构造函数（私有） =====
  private constructor(params: {
    uuid?: string;
    taskUuid: string;
    executionTime: number;
    status: ExecutionStatus;
    duration?: number | null;
    result?: Record<string, any> | null;
    error?: string | null;
    retryCount?: number;
    createdAt?: number;
  }) {
    super(params.uuid ?? Entity.generateUUID());
    this._taskUuid = params.taskUuid;
    this._executionTime = params.executionTime;
    this._status = params.status;
    this._duration = params.duration ?? null;
    this._result = params.result ?? null;
    this._error = params.error ?? null;
    this._retryCount = params.retryCount ?? 0;
    this._createdAt = params.createdAt ?? Date.now();
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get taskUuid(): string {
    return this._taskUuid;
  }
  public get executionTime(): number {
    return this._executionTime;
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
    this._status = ExecutionStatus.SUCCESS;
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
    this._status = ExecutionStatus.FAILED;
    this._error = error;
    if (duration !== undefined) {
      this._duration = duration;
    }
  }

  /**
   * 标记执行超时
   */
  public markTimeout(duration: number): void {
    this._status = ExecutionStatus.TIMEOUT;
    this._duration = duration;
    this._error = 'Execution timeout';
  }

  /**
   * 标记执行跳过
   */
  public markSkipped(reason: string): void {
    this._status = ExecutionStatus.SKIPPED;
    this._error = reason;
    this._duration = 0;
  }

  /**
   * 增加重试次数
   */
  public incrementRetry(): void {
    this._retryCount += 1;
    this._status = ExecutionStatus.RETRYING;
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
    return this._status === ExecutionStatus.SUCCESS;
  }

  /**
   * 检查是否失败
   */
  public isFailed(): boolean {
    return this._status === ExecutionStatus.FAILED;
  }

  /**
   * 检查是否超时
   */
  public isTimeout(): boolean {
    return this._status === ExecutionStatus.TIMEOUT;
  }

  /**
   * 检查是否跳过
   */
  public isSkipped(): boolean {
    return this._status === ExecutionStatus.SKIPPED;
  }

  // ===== 转换方法 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): ScheduleExecutionServerDTO {
    return {
      uuid: this._uuid,
      taskUuid: this._taskUuid,
      executionTime: this._executionTime,
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
      uuid: this._uuid,
      taskUuid: this._taskUuid,
      executionTime: this._executionTime,
      status: this._status,
      duration: this._duration,
      result: this._result ? { ...this._result } : null,
      error: this._error,
      retryCount: this._retryCount,
      createdAt: this._createdAt.getTime(),
      // UI 辅助属性
      executionTimeFormatted: new Date(this._executionTime).toLocaleString('zh-CN'),
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

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): ScheduleExecutionPersistenceDTO {
    return {
      uuid: this._uuid,
      taskUuid: this._taskUuid,
      executionTime: this._executionTime,
      status: this._status,
      duration: this._duration,
      result: this._result ? JSON.stringify(this._result) : null,
      error: this._error,
      retryCount: this._retryCount,
      createdAt: this._createdAt.getTime(),
    };
  }

  // ===== 私有辅助方法 =====

  private _getStatusText(): string {
    switch (this._status) {
      case ExecutionStatus.SUCCESS:
        return '执行成功';
      case ExecutionStatus.FAILED:
        return '执行失败';
      case ExecutionStatus.TIMEOUT:
        return '执行超时';
      case ExecutionStatus.SKIPPED:
        return '已跳过';
      case ExecutionStatus.RETRYING:
        return '重试中';
      default:
        return '未知状态';
    }
  }

  private _getStatusColor(): string {
    switch (this._status) {
      case ExecutionStatus.SUCCESS:
        return 'green';
      case ExecutionStatus.FAILED:
        return 'red';
      case ExecutionStatus.TIMEOUT:
        return 'orange';
      case ExecutionStatus.SKIPPED:
        return 'gray';
      case ExecutionStatus.RETRYING:
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
    taskUuid: string;
    executionTime: number;
    status?: ExecutionStatus;
  }): ScheduleExecution {
    return new ScheduleExecution({
      taskUuid: params.taskUuid,
      executionTime: params.executionTime,
      status: params.status ?? ExecutionStatus.SUCCESS,
      createdAt: Date.now(),
    });
  }

  /**
   * 从 Server DTO 创建实体
   */
  public static fromServerDTO(dto: ScheduleExecutionServerDTO): ScheduleExecution {
    return new ScheduleExecution({
      uuid: dto.uuid,
      taskUuid: dto.taskUuid,
      executionTime: dto.executionTime,
      status: dto.status,
      duration: dto.duration,
      result: dto.result,
      error: dto.error,
      retryCount: dto.retryCount,
      createdAt: dto.createdAt,
    });
  }

  /**
   * 从 DTO 创建实体 (兼容旧代码)
   */
  public static fromDTO(dto: any): ScheduleExecution {
    return new ScheduleExecution(dto);
  }

  /**
   * 从持久化 DTO 创建实体
   */
  public static fromPersistenceDTO(dto: any): ScheduleExecution {
    return new ScheduleExecution({
      uuid: dto.uuid,
      taskUuid: dto.taskUuid,
      executionTime: dto.executionTime,
      status: dto.status,
      duration: dto.duration,
      result: dto.result ? JSON.parse(dto.result) : null,
      error: dto.error,
      retryCount: dto.retryCount,
      createdAt: dto.createdAt,
    });
  }
}
