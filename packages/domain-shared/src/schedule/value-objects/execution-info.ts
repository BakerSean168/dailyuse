/**
 * ExecutionInfo 值对象
 * 
 * 执行信息：下次/上次执行时间、执行次数、状态、连续失败次数
 * 不可变性（所有修改返回新实例）
 */

import { ValueObject } from '@dailyuse/utils';
import type {
  IExecutionInfoServer,
  ExecutionInfoServerDTO,
  ExecutionInfoPersistenceDTO,
  ExecutionStatus,
} from '@dailyuse/contracts/schedule';

/**
 * ExecutionInfo 值对象实现
 */
export class ExecutionInfo extends ValueObject<ExecutionInfoServerDTO> implements IExecutionInfoServer {

  private constructor(props: ExecutionInfoServerDTO) {
    super(props);
  }

  // ================= 工厂方法 =================
  
  public static create(props: ExecutionInfoServerDTO): ExecutionInfo {
    return new ExecutionInfo(props);
  }

  public static createEmpty(): ExecutionInfo {
    return new ExecutionInfo({
      nextRunAt: null,
      lastRunAt: null,
      executionCount: 0,
      lastExecutionStatus: null,
      lastExecutionDuration: null,
      consecutiveFailures: 0,
    });
  }

  public static fromDTO(dto: ExecutionInfoServerDTO): ExecutionInfo {
    return new ExecutionInfo(dto);
  }

  public static fromPersistenceDTO(dto: ExecutionInfoPersistenceDTO): ExecutionInfo {
    return new ExecutionInfo({
      nextRunAt: dto.nextRunAt,
      lastRunAt: dto.lastRunAt,
      executionCount: dto.executionCount,
      lastExecutionStatus: dto.lastExecutionStatus as ExecutionStatus | null,
      lastExecutionDuration: dto.last_execution_duration,
      consecutiveFailures: dto.consecutive_failures,
    });
  }

  // ================= Getters =================

  public get nextRunAt(): number | null {
    return this.props.nextRunAt !== null ? new Date(this.props.nextRunAt).getTime() : null;
  }

  public get lastRunAt(): number | null {
    return this.props.lastRunAt !== null ? new Date(this.props.lastRunAt).getTime() : null;
  }

  public get executionCount(): number {
    return this.props.executionCount;
  }

  public get lastExecutionStatus(): ExecutionStatus | null {
    return this.props.lastExecutionStatus;
  }

  public get lastExecutionDuration(): number | null {
    return this.props.lastExecutionDuration;
  }

  public get consecutiveFailures(): number {
    return this.props.consecutiveFailures;
  }

  // ================= 行为方法 =================

  public with(
    updates: Partial<Omit<IExecutionInfoServer, 'equals' | 'with' | 'updateAfterExecution' | 'resetFailures' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'>>,
  ): ExecutionInfo {
    // 将 number 时间戳转换为 ISO string
    const convertedUpdates: Partial<ExecutionInfoServerDTO> = {};
    
    if (updates.nextRunAt !== undefined) {
      convertedUpdates.nextRunAt = updates.nextRunAt !== null 
        ? new Date(updates.nextRunAt).toISOString() 
        : null;
    }
    if (updates.lastRunAt !== undefined) {
      convertedUpdates.lastRunAt = updates.lastRunAt !== null 
        ? new Date(updates.lastRunAt).toISOString() 
        : null;
    }
    if (updates.executionCount !== undefined) {
      convertedUpdates.executionCount = updates.executionCount;
    }
    if (updates.lastExecutionStatus !== undefined) {
      convertedUpdates.lastExecutionStatus = updates.lastExecutionStatus;
    }
    if (updates.lastExecutionDuration !== undefined) {
      convertedUpdates.lastExecutionDuration = updates.lastExecutionDuration;
    }
    if (updates.consecutiveFailures !== undefined) {
      convertedUpdates.consecutiveFailures = updates.consecutiveFailures;
    }
    
    return new ExecutionInfo({ ...this.props, ...convertedUpdates });
  }

  public updateAfterExecution(params: {
    executedAt: number;
    status: ExecutionStatus;
    duration: number;
    nextRunAt: number | null;
  }): ExecutionInfo {
    const isSuccess = params.status === 'Success';
    return new ExecutionInfo({
      nextRunAt: params.nextRunAt !== null ? new Date(params.nextRunAt).toISOString() : null,
      lastRunAt: new Date(params.executedAt).toISOString(),
      executionCount: this.props.executionCount + 1,
      lastExecutionStatus: params.status,
      lastExecutionDuration: params.duration,
      consecutiveFailures: isSuccess ? 0 : this.props.consecutiveFailures + 1,
    });
  }

  public resetFailures(): ExecutionInfo {
    return this.with({ consecutiveFailures: 0 });
  }

  public setNextRunAt(nextRunAt: number | null): ExecutionInfo {
    return this.with({ nextRunAt });
  }

  // ================= 计算属性 =================

  public get hasExecuted(): boolean {
    return this.props.executionCount > 0;
  }

  public get isHealthy(): boolean {
    return this.props.consecutiveFailures === 0;
  }

  public get healthStatus(): 'healthy' | 'warning' | 'critical' {
    if (this.props.consecutiveFailures === 0) return 'healthy';
    if (this.props.consecutiveFailures < 3) return 'warning';
    return 'critical';
  }

  public get lastExecutionDurationMs(): number | null {
    return this.props.lastExecutionDuration;
  }

  // ================= 序列化 =================

  public toServerDTO(): ExecutionInfoServerDTO {
    return { ...this.props };
  }

  public toPersistenceDTO(): ExecutionInfoPersistenceDTO {
    return {
      nextRunAt: this.props.nextRunAt,
      lastRunAt: this.props.lastRunAt,
      executionCount: this.props.executionCount,
      lastExecutionStatus: this.props.lastExecutionStatus,
      last_execution_duration: this.props.lastExecutionDuration,
      consecutive_failures: this.props.consecutiveFailures,
    };
  }
}
