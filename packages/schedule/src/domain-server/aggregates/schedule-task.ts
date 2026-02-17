/**
 * ScheduleTask 聚合根实�?
 * 任务调度聚合�?
 *
 * DDD 聚合根职责：
 * - 管理任务生命周期
 * - 管理执行记录子实�?
 * - 执行业务逻辑
 * - 确保聚合内的一致�?
 */

import { AggregateRoot } from '@dailyuse/utils';
import type {
  ScheduleTaskClientDTO,
  ScheduleTaskPersistenceDTO,
  ScheduleTaskServer,
  ScheduleTaskServerDTO,
} from '@dailyuse/contracts/schedule';
import { ExecutionStatus, ScheduleTaskStatus, SourceModule } from '@dailyuse/contracts/schedule';
import { ScheduleTaskId } from '../../domain-shared/value-objects/schedule-task-id';
import { ScheduleConfig } from '../value-objects/ScheduleConfig';
import { ExecutionInfo } from '../value-objects/ExecutionInfo';
import { RetryPolicy } from '../value-objects/RetryPolicy';
import { TaskMetadata } from '../value-objects/TaskMetadata';
import { ScheduleExecution } from '../entities/schedule-execution';

/**
 * ScheduleTask 内部状态接口 for simplified aggregate pattern
 */
interface ScheduleTaskState {
  identityId: string;
  name: string;
  description: string | null;
  sourceModule: SourceModule;
  sourceEntityId: string;
  status: ScheduleTaskStatus;
  enabled: boolean;
  schedule: ScheduleConfig;
  execution: ExecutionInfo;
  retryPolicy: RetryPolicy;
  metadata: TaskMetadata;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  deletedAt: Date | null;
}

/**
 * ScheduleTask 聚合根
 */
export class ScheduleTask extends AggregateRoot<ScheduleTaskId> implements ScheduleTaskServer {
  // ===== 私有字段 =====
  private _props: ScheduleTaskState;

  // ===== 子实体集合 =====
  private _executions: ScheduleExecution[];

  // ===== 构造函数（私有） =====
  private constructor(params: {
    id?: string;
    identityId: string;
    name: string;
    description?: string | null;
    sourceModule: SourceModule;
    sourceEntityId: string;
    status: ScheduleTaskStatus;
    enabled: boolean;
    schedule: ScheduleConfig;
    execution: ExecutionInfo;
    retryPolicy: RetryPolicy;
    metadata: TaskMetadata;
    createdAt: Date;
    updatedAt: Date;
    version: number;
    deletedAt: Date | null;
  }) {
    super(params.id ? ScheduleTaskId.of(params.id) : ScheduleTaskId.generate());
    this._props = {
      identityId: params.identityId,
      name: params.name,
      description: params.description ?? null,
      sourceModule: params.sourceModule,
      sourceEntityId: params.sourceEntityId,
      status: params.status,
      enabled: params.enabled,
      schedule: params.schedule,
      execution: params.execution,
      retryPolicy: params.retryPolicy,
      metadata: params.metadata,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
      version: params.version,
      deletedAt: params.deletedAt,
    };
    this._executions = [];
  }

  // ===== Getter 属性 =====

  public get identityId(): string {
    return this._props.identityId;
  }
  public get name(): string {
    return this._props.name;
  }
  public get description(): string | null {
    return this._props.description;
  }
  public get sourceModule(): SourceModule {
    return this._props.sourceModule;
  }
  public get sourceEntityId(): string {
    return this._props.sourceEntityId;
  }
  public get status(): ScheduleTaskStatus {
    return this._props.status;
  }
  public get enabled(): boolean {
    return this._props.enabled;
  }
  public get schedule(): ScheduleConfig {
    return this._props.schedule;
  }
  public get execution(): ExecutionInfo {
    return this._props.execution;
  }
  public get retryPolicy(): RetryPolicy {
    return this._props.retryPolicy;
  }
  public get metadata(): TaskMetadata {
    return this._props.metadata;
  }
  public get createdAt(): Date {
    return this._props.createdAt;
  }
  public get updatedAt(): Date {
    return this._props.updatedAt;
  }
  public get version(): number {
    return this._props.version;
  }
  public get deletedAt(): Date | null {
    return this._props.deletedAt;
  }
  public get executions(): ScheduleExecution[] | null {
    return this._executions.length > 0 ? [...this._executions] : null;
  }

  // ===== 便捷访问器方法 =====

  /**
   * 获取任务名称（便捷访问器）
   */
  public get taskName(): string {
    return this._props.name;
  }

  /**
   * 获取下次执行时间（便捷访问器）
   * @returns Date 对象或 null
   */
  public get nextRunAt(): Date | null {
    return this._props.execution.nextRunAt ? new Date(this._props.execution.nextRunAt) : null;
  }

  /**
   * 获取执行次数（便捷访问器）
   */
  public get executionCount(): number {
    return this._props.execution.executionCount;
  }

  /**
   * 获取最大执行次数（便捷访问器）
   */
  public get maxExecutions(): number | null {
    return this._props.schedule.maxExecutions;
  }

  /**
   * 获取执行信息值对象
   */
  public getExecutionInfo(): ExecutionInfo {
    return this._props.execution;
  }

  /**
   * 获取调度配置值对象
   */
  public getScheduleConfig(): ScheduleConfig {
    return this._props.schedule;
  }

  /**
   * 获取重试策略值对象
   */
  public getRetryPolicyVO(): RetryPolicy {
    return this._props.retryPolicy;
  }

  /**
   * 获取任务元数据值对象
   */
  public getTaskMetadata(): TaskMetadata {
    return this._props.metadata;
  }

  // ===== 工厂方法（创建子实体�?=====

  /**
   * 创建执行记录
   */
  public createExecution(params: {
    executionTime: number;
    status?: ExecutionStatus;
  }): ScheduleExecution {
    const execution = ScheduleExecution.create({
      taskId: this.id,
      executionTime: params.executionTime,
      status: params.status,
    });
    return execution;
  }

  // ===== 子实体管理方�?=====

  /**
   * 添加执行记录
   */
  public addExecution(execution: ScheduleExecution): void {
    this._executions.push(execution);
  }

  /**
   * 获取执行记录
   */
  public getExecution(id: string): ScheduleExecution | null {
    return this._executions.find((e) => e.id === id) ?? null;
  }

  /**
   * 获取所有执行记�?
   */
  public getAllExecutions(): ScheduleExecution[] {
    return [...this._executions];
  }

  /**
   * 获取最近的执行记录
   */
  public getRecentExecutions(limit: number): ScheduleExecution[] {
    return this._executions.sort((a, b) => b.executionTime - a.executionTime).slice(0, limit);
  }

  /**
   * 获取失败的执行记�?
   */
  public getFailedExecutions(): ScheduleExecution[] {
    return this._executions.filter((e) => e.isFailed() || e.isTimeout());
  }

  // ===== 生命周期管理 =====

  /**
   * 暂停任务
   */
  public pause(reason?: string): void {
    if (
      this._props.status === ScheduleTaskStatus.Completed ||
      this._props.status === ScheduleTaskStatus.Cancelled
    ) {
      throw new Error('Cannot pause a completed or cancelled task');
    }
    this._props.status = ScheduleTaskStatus.Paused;
    // 自动禁用，保持状态一致
    this._props.enabled = false;
    this._props.updatedAt = new Date();

    // 发布事件
    this.addDomainEvent('schedule.task.paused', {
      taskId: this.id,
      sourceModule: this._props.sourceModule,
      sourceEntityId: this._props.sourceEntityId,
      reason,
    });
  }

  /**
   * 恢复任务
   */
  public resume(): void {
    if (this._props.status !== ScheduleTaskStatus.Paused) {
      throw new Error('Can only resume a paused task');
    }
    this._props.status = ScheduleTaskStatus.Active;
    // 自动启用
    this._props.enabled = true;
    this._props.updatedAt = new Date();

    // 重新计算下次执行时间 (使用当前时间作为默认值)
    const nextRunAt = Date.now();
    this._props.execution = this._props.execution.with({ nextRunAt });

    // 发布事件
    this.addDomainEvent('schedule.task.resumed', {
      taskId: this.id,
      sourceModule: this._props.sourceModule,
      sourceEntityId: this._props.sourceEntityId,
      nextRunAt,
    });
  }

  /**
   * 完成任务
   */
  public complete(): void {
    this._props.status = ScheduleTaskStatus.Completed;
    this._props.updatedAt = new Date();

    // 发布事件
    this.addDomainEvent('schedule.task.completed', {
      taskId: this.id,
      sourceModule: this._props.sourceModule,
      sourceEntityId: this._props.sourceEntityId,
      totalExecutions: this._props.execution.executionCount,
    });
  }

  /**
   * 取消任务
   */
  public cancel(reason: string): void {
    if (this._props.status === ScheduleTaskStatus.Completed) {
      throw new Error('Cannot cancel a completed task');
    }
    this._props.status = ScheduleTaskStatus.Cancelled;
    this._props.updatedAt = new Date();

    // 发布事件
    this.addDomainEvent('schedule.task.cancelled', {
      taskId: this.id,
      sourceModule: this._props.sourceModule,
      sourceEntityId: this._props.sourceEntityId,
      reason,
    });
  }

  /**
   * 标记失败
   */
  public fail(error: string): void {
    this._props.status = ScheduleTaskStatus.Failed;
    this._props.updatedAt = new Date();

    // 发布事件
    this.addDomainEvent('schedule.task.failed', {
      taskId: this.id,
      sourceModule: this._props.sourceModule,
      sourceEntityId: this._props.sourceEntityId,
      error,
      consecutiveFailures: this._props.execution.consecutiveFailures,
    });
  }

  // ===== 调度配置管理 =====

  /**
   * 更新调度配置
   */
  public updateSchedule(schedule: Partial<any>): void {
    const oldCron = this._props.schedule.cronExpression;
    this._props.schedule = this._props.schedule.with(schedule);
    this._props.updatedAt = new Date();

    // 重新计算下次执行时间 (使用当前时间作为默认值)
    const nextRunAt = Date.now();
    this._props.execution = this._props.execution.with({ nextRunAt });

    // 发布事件
    this.addDomainEvent('schedule.task.schedule.updated', {
      taskId: this.id,
      previousCronExpression: oldCron,
      newCronExpression: this._props.schedule.cronExpression,
      nextRunAt,
    });
  }

  /**
   * 更新 Cron 表达式
   */
  public updateCronExpression(cronExpression: string): void {
    this.updateSchedule({ cronExpression });
  }

  /**
   * 计算下次执行时间
   * 接口签名: calculateNextRun(): number
   */
  public calculateNextRun(): number {
    // 使用当前时间作为默认值 (计算逻辑可以在外部实现)
    return Date.now();
  }

  // ===== 执行信息管理 =====

  /**
   * 执行任务
   *
   * @description
   * 1. 验证任务是否可执行（状态、启用、到期）
   * 2. 发布 schedule.task.triggered 领域事件
   * 3. 更新 nextRunAt（由外部 recordExecution 记录结果）
   *
   * @returns 是否成功触发执行
   */
  public execute(): boolean {
    // 1. 检查任务是否可执行
    if (!this.canExecute()) {
      return false;
    }

    // 2. 发布领域事件（通知其他模块任务被触发）
    // 完整序列化 metadata DTO 以确保正确传递
    const metadataDTO = this._props.metadata.toServerDTO();
    this.addDomainEvent('schedule.task.triggered', {
      taskId: this.id,
      taskName: this._props.name,
      sourceModule: this._props.sourceModule,
      sourceEntityId: this._props.sourceEntityId,
      executionTime: Date.now(),
      metadata: metadataDTO,
    });

    return true;
  }

  /**
   * 检查任务是否可执行
   */
  public canExecute(): boolean {
    // 任务必须是活跃状态
    if (this._props.status !== ScheduleTaskStatus.Active) {
      return false;
    }

    // 任务必须启用
    if (!this._props.enabled) {
      return false;
    }

    // 检查是否到期
    const now = Date.now();
    const nextRun = this._props.execution.nextRunAt;
    if (!nextRun || nextRun > now) {
      return false;
    }

    // 检查是否达到最大执行次数
    const maxExecutions = this._props.schedule.maxExecutions;
    if (maxExecutions !== null && this._props.execution.executionCount >= maxExecutions) {
      return false;
    }

    return true;
  }

  /**
   * 记录执行
   */
  public recordExecution(
    status: ExecutionStatus,
    duration: number,
    result?: Record<string, any>,
    error?: string,
  ): ScheduleExecution {
    const execution = this.createExecution({
      executionTime: Date.now(),
      status,
    });

    if (status === ExecutionStatus.Success) {
      execution.markSuccess(duration, result);
    } else if (status === ExecutionStatus.Failed) {
      execution.markFailed(error || 'Unknown error', duration);
    } else if (status === ExecutionStatus.Timeout) {
      execution.markTimeout(duration);
    } else if (status === ExecutionStatus.Skipped) {
      execution.markSkipped(error || 'Skipped');
    }

    this.addExecution(execution);

    // 更新执行信息
    const nextRunAt = Date.now(); // 使用当前时间作为默认值
    this._props.execution = this._props.execution.updateAfterExecution({
      executedAt: Date.now(),
      status,
      duration,
      nextRunAt,
    });

    this._props.updatedAt = new Date();

    // 发布事件
    this.addDomainEvent('schedule.task.executed', {
      taskId: this.id,
      executionId: execution.id,
      sourceModule: this._props.sourceModule,
      sourceEntityId: this._props.sourceEntityId,
      status,
      duration,
      payload: this._props.metadata.toServerDTO().payload,
    });

    return execution;
  }

  /**
   * 更新执行信息
   */
  public updateExecutionInfo(updates: Partial<any>): void {
    this._props.execution = this._props.execution.with(updates);
    this._props.updatedAt = new Date();
  }

  /**
   * 重置失败计数
   */
  public resetFailures(): void {
    this._props.execution = this._props.execution.resetFailures();
    this._props.updatedAt = new Date();
  }

  // ===== 重试策略管理 =====

  /**
   * 更新重试策略
   */
  public updateRetryPolicy(policy: Partial<any>): void {
    this._props.retryPolicy = this._props.retryPolicy.with(policy);
    this._props.updatedAt = new Date();
  }

  /**
   * 判断是否应该重试
   */
  public shouldRetry(): boolean {
    const execInfo = this._props.execution;
    return this._props.retryPolicy.shouldRetry(execInfo.consecutiveFailures);
  }

  /**
   * 计算下次重试延迟
   */
  public calculateNextRetryDelay(): number {
    const execInfo = this._props.execution;
    return this._props.retryPolicy.calculateNextRetryDelay(execInfo.consecutiveFailures);
  }

  // ===== 元数据管理 =====

  /**
   * 更新元数据
   */
  public updateMetadata(metadata: Partial<any>): void {
    this._props.metadata = this._props.metadata.with(metadata);
    this._props.updatedAt = new Date();
  }

  /**
   * 更新 Payload
   */
  public updatePayload(payload: Record<string, any>): void {
    this._props.metadata = this._props.metadata.setPayload(payload);
    this._props.updatedAt = new Date();
  }

  /**
   * 添加标签
   */
  public addTag(tag: string): void {
    this._props.metadata = this._props.metadata.addTag(tag);
    this._props.updatedAt = new Date();
  }

  /**
   * 移除标签
   */
  public removeTag(tag: string): void {
    this._props.metadata = this._props.metadata.removeTag(tag);
    this._props.updatedAt = new Date();
  }

  // ===== 启用/禁用 =====

  /**
   * 启用任务
   */
  public enable(): void {
    this._props.enabled = true;
    // 如果当前是暂停状态，自动切换为活跃
    if (this._props.status === ScheduleTaskStatus.Paused) {
      this._props.status = ScheduleTaskStatus.Active;
    }
    this._props.updatedAt = new Date();
  }

  /**
   * 禁用任务
   */
  public disable(): void {
    this._props.enabled = false;
    // 如果当前是活跃状态，自动切换为暂停
    if (this._props.status === ScheduleTaskStatus.Active) {
      this._props.status = ScheduleTaskStatus.Paused;
    }
    this._props.updatedAt = new Date();
  }

  // ===== 状态检查 =====

  public isActive(): boolean {
    return this._props.status === ScheduleTaskStatus.Active;
  }

  public isPaused(): boolean {
    return this._props.status === ScheduleTaskStatus.Paused;
  }

  public isCompleted(): boolean {
    return this._props.status === ScheduleTaskStatus.Completed;
  }

  public isCancelled(): boolean {
    return this._props.status === ScheduleTaskStatus.Cancelled;
  }

  public isFailed(): boolean {
    return this._props.status === ScheduleTaskStatus.Failed;
  }

  public isExpired(): boolean {
    return this._props.schedule.isExpired;
  }

  // ===== UI 辅助方法 =====

  /**
   * 获取状态显示文本
   */
  public getStatusDisplay(): string {
    const statusMap: Record<ScheduleTaskStatus, string> = {
      [ScheduleTaskStatus.Active]: '活跃',
      [ScheduleTaskStatus.Paused]: '暂停',
      [ScheduleTaskStatus.Completed]: '完成',
      [ScheduleTaskStatus.Cancelled]: '取消',
      [ScheduleTaskStatus.Failed]: '失败',
    };
    return statusMap[this._props.status] || this._props.status;
  }

  /**
   * 获取状态颜色
   */
  public getStatusColor(): string {
    const colorMap: Record<ScheduleTaskStatus, string> = {
      [ScheduleTaskStatus.Active]: 'green',
      [ScheduleTaskStatus.Paused]: 'gray',
      [ScheduleTaskStatus.Completed]: 'blue',
      [ScheduleTaskStatus.Cancelled]: 'red',
      [ScheduleTaskStatus.Failed]: 'orange',
    };
    return colorMap[this._props.status] || 'gray';
  }

  /**
   * 获取来源模块显示文本
   */
  public getSourceModuleDisplay(): string {
    const moduleMap: Record<SourceModule, string> = {
      [SourceModule.Reminder]: '提醒模块',
      [SourceModule.Task]: '任务模块',
      [SourceModule.Goal]: '目标模块',
      [SourceModule.Notification]: '通知模块',
      [SourceModule.System]: '系统模块',
      [SourceModule.Custom]: '自定义模块',
    };
    return moduleMap[this._props.sourceModule] || this._props.sourceModule;
  }

  /**
   * 格式化下次运行时间
   */
  public getNextRunAtFormatted(): string {
    if (!this._props.execution.nextRunAt) return '-';
    const date = new Date(this._props.execution.nextRunAt);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  /**
   * 格式化上次运行时间
   */
  public getLastRunAtFormatted(): string {
    if (!this._props.execution.lastRunAt) return '-';
    const date = new Date(this._props.execution.lastRunAt);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  /**
   * 获取执行摘要
   */
  public getExecutionSummary(): string {
    const count = this._props.execution.executionCount;
    const failures = this._props.execution.consecutiveFailures;
    const successCount = count - failures;
    return `已执行 ${count} 次，成功 ${successCount} 次`;
  }

  /**
   * 获取健康状态
   */
  public getHealthStatus(): string {
    const failures = this._props.execution.consecutiveFailures;
    if (failures === 0) return 'healthy';
    if (failures < 3) return 'warning';
    return 'critical';
  }

  /**
   * 检查是否过期
   */
  public isOverdue(): boolean {
    if (!this._props.execution.nextRunAt) return false;
    return this._props.execution.nextRunAt < Date.now();
  }

  // ===== 转换方法 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(includeChildren: boolean = false): ScheduleTaskServerDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      sourceModule: this._props.sourceModule,
      sourceEntityId: this._props.sourceEntityId,
      status: this._props.status,
      enabled: this._props.enabled,
      schedule: this._props.schedule.toServerDTO(),
      execution: this._props.execution.toServerDTO(),
      retryPolicy: this._props.retryPolicy.toServerDTO(),
      metadata: this._props.metadata.toServerDTO(),
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      version: this._props.version,
      deletedAt: this._props.deletedAt ? this._props.deletedAt.getTime() : null,
      executions: includeChildren ? this._executions.map((e) => e.toServerDTO()) : undefined,
    };
  }

  /**
   * 转换为 Client DTO (用于客户端)
   */
  public toClientDTO(includeChildren: boolean = false): ScheduleTaskClientDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      sourceModule: this._props.sourceModule,
      sourceEntityId: this._props.sourceEntityId,
      status: this._props.status,
      enabled: this._props.enabled,
      schedule: this._props.schedule.toServerDTO() as any,
      execution: this._props.execution.toServerDTO() as any,
      retryPolicy: this._props.retryPolicy.toServerDTO() as any,
      metadata: this._props.metadata.toServerDTO() as any,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      executions: includeChildren ? this._executions.map((e) => e.toClientDTO()) : null,
      // UI 辅助属性
      statusDisplay: this.getStatusDisplay(),
      statusColor: this.getStatusColor(),
      sourceModuleDisplay: this.getSourceModuleDisplay(),
      enabledDisplay: this.enabled ? '启用' : '禁用',
      nextRunAtFormatted: this.getNextRunAtFormatted(),
      lastRunAtFormatted: this.getLastRunAtFormatted(),
      executionSummary: this.getExecutionSummary(),
      healthStatus: this.getHealthStatus(),
      isOverdue: this.isOverdue(),
    };
  }

  /**
   * 转换为持久化 DTO（全部使用 camelCase）
   */
  public toPersistenceDTO(): ScheduleTaskPersistenceDTO {
    const scheduleDTO = this._props.schedule.toServerDTO();
    const executionDTO = this._props.execution.toServerDTO();
    const retryPolicyDTO = this._props.retryPolicy.toServerDTO();
    const metadataDTO = this._props.metadata.toServerDTO();

    return {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      sourceModule: this._props.sourceModule,
      sourceEntityId: this._props.sourceEntityId,
      status: this._props.status,
      enabled: this._props.enabled,
      // ScheduleConfig (flattened)
      cronExpression: this._props.schedule.cronExpression,
      timezone: this._props.schedule.timezone,
      startDate: this._props.schedule.startDate !== null ? new Date(this._props.schedule.startDate) : null,
      endDate: this._props.schedule.endDate !== null ? new Date(this._props.schedule.endDate) : null,
      maxExecutions: this._props.schedule.maxExecutions,
      // ExecutionInfo (flattened)
      nextRunAt: this._props.execution.nextRunAt !== null ? new Date(this._props.execution.nextRunAt) : null,
      lastRunAt: this._props.execution.lastRunAt !== null ? new Date(this._props.execution.lastRunAt) : null,
      executionCount: this._props.execution.executionCount,
      lastExecutionStatus: this._props.execution.lastExecutionStatus
        ? String(this._props.execution.lastExecutionStatus)
        : null,
      lastExecutionDuration: this._props.execution.lastExecutionDuration,
      consecutiveFailures: this._props.execution.consecutiveFailures,
      // RetryPolicy (flattened)
      maxRetries: this._props.retryPolicy.maxRetries,
      initialDelayMs: this._props.retryPolicy.retryDelay,
      maxDelayMs: this._props.retryPolicy.maxRetryDelay,
      backoffMultiplier: this._props.retryPolicy.backoffMultiplier,
      retryableStatuses: '[]',
      // TaskMetadata (flattened)
      payload: metadataDTO.payload,
      tags: JSON.stringify(metadataDTO.tags),
      priority: metadataDTO.priority,
      timeout: metadataDTO.timeout,
      // Timestamps
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      // Sync fields
      version: this._props.version,
      deletedAt: this._props.deletedAt,
    };
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建新任务
   */
  public static create(params: {
    identityId: string;
    name: string;
    sourceModule: SourceModule;
    sourceEntityId: string;
    schedule: ScheduleConfig;
    description?: string;
    metadata?: TaskMetadata;
    retryPolicy?: RetryPolicy;
  }): ScheduleTask {
    const now = new Date();
    const nextRunAt = now.getTime(); // Use current time as default

    const task = new ScheduleTask({
      identityId: params.identityId,
      name: params.name,
      description: params.description,
      sourceModule: params.sourceModule,
      sourceEntityId: params.sourceEntityId,
      status: ScheduleTaskStatus.Active,
      enabled: true,
      schedule: params.schedule,
      execution: ExecutionInfo.fromDTO({
        nextRunAt: new Date(nextRunAt).toISOString(),
        lastRunAt: null,
        executionCount: 0,
        lastExecutionStatus: null,
        lastExecutionDuration: null,
        consecutiveFailures: 0
      }),
      retryPolicy: params.retryPolicy || RetryPolicy.createDefault(),
      metadata: params.metadata || TaskMetadata.createDefault(),
      createdAt: now,
      updatedAt: now,
      version: 1,
      deletedAt: null,
    });

    // 发布创建事件
    task.addDomainEvent('schedule.task.created', {
      taskId: task.id,
      name: params.name,
      sourceModule: params.sourceModule,
      sourceEntityId: params.sourceEntityId,
      cronExpression: params.schedule.toServerDTO().cronExpression,
      nextRunAt,
    });

    return task;
  }

  /**
   * �?Server DTO 创建
   */
  public static fromServerDTO(dto: ScheduleTaskServerDTO): ScheduleTask {
    const task = new ScheduleTask({
      id: dto.id,
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      sourceModule: dto.sourceModule,
      sourceEntityId: dto.sourceEntityId,
      status: dto.status,
      enabled: dto.enabled,
      schedule: ScheduleConfig.fromDTO(dto.schedule),
      execution: ExecutionInfo.fromDTO(dto.execution),
      retryPolicy: RetryPolicy.fromDTO(dto.retryPolicy),
      metadata: TaskMetadata.fromDTO(dto.metadata),
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      version: (dto as any).version ?? 1,
      deletedAt: (dto as any).deletedAt ? new Date((dto as any).deletedAt) : null,
    });

    if (dto.executions) {
      dto.executions.forEach((execDTO) => {
        task.addExecution(ScheduleExecution.fromServerDTO(execDTO));
      });
    }

    return task;
  }

  /**
   * �?DTO 创建 (兼容旧代�?
   */
  public static fromDTO(dto: any): ScheduleTask {
    // 尝试判断�?ServerDTO 还是�?DTO
    if (dto.schedule && typeof dto.schedule.startDate === 'string') {
      return this.fromServerDTO(dto);
    }

    // 从 DTO 处理
    const task = new ScheduleTask({
      id: dto.id,
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      sourceModule: dto.sourceModule,
      sourceEntityId: dto.sourceEntityId,
      status: dto.status,
      enabled: dto.enabled,
      schedule: ScheduleConfig.fromDTO(dto.schedule),
      execution: ExecutionInfo.fromDTO(dto.execution),
      retryPolicy: RetryPolicy.fromDTO(dto.retryPolicy),
      metadata: TaskMetadata.fromDTO(dto.metadata),
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      version: dto.version ?? 1,
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });

    if (dto.executions) {
      dto.executions.forEach((execDTO: any) => {
        task.addExecution(ScheduleExecution.fromDTO(execDTO));
      });
    }

    return task;
  }

  /**
   * 从持久化 DTO 创建
   */
  public static fromPersistenceDTO(dto: any): ScheduleTask {
    return new ScheduleTask({
      id: dto.id,
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      sourceModule: dto.sourceModule,
      sourceEntityId: dto.sourceEntityId,
      status: dto.status,
      enabled: dto.enabled,
      schedule: ScheduleConfig.fromPersistenceDTO({
        cronExpression: dto.cronExpression ?? null,
        timezone: dto.timezone,
        startDate: dto.startDate ?? null,
        endDate: dto.endDate ?? null,
        maxExecutions: dto.maxExecutions ?? null,
      }),
      execution: ExecutionInfo.fromPersistenceDTO({
        nextRunAt: dto.nextRunAt,
        lastRunAt: dto.lastRunAt,
        executionCount: dto.executionCount,
        lastExecutionStatus: (dto.lastExecutionStatus as ExecutionStatus) ?? null,
        last_execution_duration: dto.lastExecutionDuration ?? dto.last_execution_duration ?? null,
        consecutive_failures: dto.consecutiveFailures ?? dto.consecutive_failures ?? 0,
      }),
      retryPolicy: RetryPolicy.fromPersistenceDTO({
        enabled: dto.enabled,
        maxRetries: dto.maxRetries,
        retry_delay: dto.initialDelayMs ?? dto.retry_delay ?? 0,
        backoff_multiplier: dto.backoffMultiplier ?? dto.backoff_multiplier ?? 1,
        max_retry_delay: dto.maxDelayMs ?? dto.max_retry_delay ?? 0,
      }),
      metadata: TaskMetadata.fromPersistenceDTO({
        payload: dto.payload ?? {},
        tags: dto.tags ? (typeof dto.tags === 'string' ? JSON.parse(dto.tags) : dto.tags) : [],
        priority: dto.priority,
        timeout: dto.timeout,
      }),
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      version: dto.version ?? 1,
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
    });
  }
}
