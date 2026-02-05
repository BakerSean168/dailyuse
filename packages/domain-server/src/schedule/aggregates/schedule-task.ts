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

import { AggregateRoot, generateUUID } from '@dailyuse/utils';
import type {
  ScheduleTaskClientDTO,
  ScheduleTaskPersistenceDTO,
  ScheduleTaskServer,
  ScheduleTaskServerDTO,
} from '@dailyuse/contracts/schedule';
import { ExecutionStatus, ScheduleTaskStatus, SourceModule } from '@dailyuse/contracts/schedule';
import { ScheduleConfig } from '../value-objects/ScheduleConfig';
import { ExecutionInfo } from '../value-objects/ExecutionInfo';
import { RetryPolicy } from '../value-objects/RetryPolicy';
import { TaskMetadata } from '../value-objects/TaskMetadata';
import { ScheduleExecution } from '../entities/schedule-execution';

/**
 * ScheduleTask 聚合�?
 */
export class ScheduleTask extends AggregateRoot<string> implements ScheduleTaskServer {
  // ===== 私有字段 =====
  private _identityId: string;
  private _name: string;
  private _description: string | null;
  private _sourceModule: SourceModule;
  private _sourceEntityId: string;
  private _status: ScheduleTaskStatus;
  private _enabled: boolean;
  private _schedule: ScheduleConfig;
  private _execution: ExecutionInfo;
  private _retryPolicy: RetryPolicy;
  private _metadata: TaskMetadata;
  private _createdAt: Date;
  private _updatedAt: Date;

  // ===== 子实体集�?=====
  private _executions: ScheduleExecution[];

  // ===== 构造函数（私有�?=====
  private constructor(params: {
    uuid?: string;
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
  }) {
    super(params.uuid || generateUUID());
    this._identityId = params.identityId;
    this._name = params.name;
    this._description = params.description ?? null;
    this._sourceModule = params.sourceModule;
    this._sourceEntityId = params.sourceEntityId;
    this._status = params.status;
    this._enabled = params.enabled;
    this._schedule = params.schedule;
    this._execution = params.execution;
    this._retryPolicy = params.retryPolicy;
    this._metadata = params.metadata;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._executions = [];
  }

  // ===== Getter 属性 =====
  public get uuid(): string {
    return this.id;
  }
  public get identityId(): string {
    return this._identityId;
  }
  // Alias for interface compatibility
  public get accountUuid(): string {
    return this._identityId;
  }
  public get name(): string {
    return this._name;
  }
  public get description(): string | null {
    return this._description;
  }
  public get sourceModule(): SourceModule {
    return this._sourceModule;
  }
  public get sourceEntityId(): string {
    return this._sourceEntityId;
  }
  public get status(): ScheduleTaskStatus {
    return this._status;
  }
  public get enabled(): boolean {
    return this._enabled;
  }
  public get schedule(): ScheduleConfig {
    return this._schedule;
  }
  public get execution(): ExecutionInfo {
    return this._execution;
  }
  public get retryPolicy(): RetryPolicy {
    return this._retryPolicy;
  }
  public get metadata(): TaskMetadata {
    return this._metadata;
  }
  public get createdAt(): Date {
    return this._createdAt;
  }
  public get updatedAt(): Date {
    return this._updatedAt;
  }
  public get executions(): ScheduleExecution[] | null {
    return this._executions.length > 0 ? [...this._executions] : null;
  }

  // ===== 便捷访问器方�?=====

  /**
   * 获取任务名称（便捷访问器�?
   */
  public get taskName(): string {
    return this._name;
  }

  /**
   * 获取下次执行时间（便捷访问器�?
   * @returns Date 对象�?null
   */
  public get nextRunAt(): Date | null {
    return this._execution.nextRunAt ? new Date(this._execution.nextRunAt) : null;
  }

  /**
   * 获取执行次数（便捷访问器�?
   */
  public get executionCount(): number {
    return this._execution.executionCount;
  }

  /**
   * 获取最大执行次数（便捷访问器）
   */
  public get maxExecutions(): number | null {
    return this._schedule.maxExecutions;
  }

  /**
   * 获取执行信息值对�?
   */
  public getExecutionInfo(): ExecutionInfo {
    return this._execution;
  }

  /**
   * 获取调度配置值对�?
   */
  public getScheduleConfig(): ScheduleConfig {
    return this._schedule;
  }

  /**
   * 获取重试策略值对�?
   */
  public getRetryPolicyVO(): RetryPolicy {
    return this._retryPolicy;
  }

  /**
   * 获取任务元数据值对�?
   */
  public getTaskMetadata(): TaskMetadata {
    return this._metadata;
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
      taskUuid: this.id,
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
  public getExecution(uuid: string): ScheduleExecution | null {
    return this._executions.find((e) => e.uuid === uuid) ?? null;
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
      this._status === ScheduleTaskStatus.Completed ||
      this._status === ScheduleTaskStatus.Cancelled
    ) {
      throw new Error('Cannot pause a completed or cancelled task');
    }
    this._status = ScheduleTaskStatus.Paused;
    // 自动禁用，保持状态一致�?
    this._enabled = false;
    this._updatedAt = new Date();

    // 发布事件
    this.addDomainEvent('schedule.task.paused', {
      taskUuid: this.id,
      sourceModule: this._sourceModule,
      sourceEntityId: this._sourceEntityId,
      reason,
    });
  }

  /**
   * 恢复任务
   */
  public resume(): void {
    if (this._status !== ScheduleTaskStatus.Paused) {
      throw new Error('Can only resume a paused task');
    }
    this._status = ScheduleTaskStatus.Active;
    // 自动启用
    this._enabled = true;
    this._updatedAt = new Date();

    // 重新计算下次执行时间 (使用当前时间作为默认值)
    const nextRunAt = Date.now();
    this._execution = this._execution.with({ nextRunAt });

    // 发布事件
    this.addDomainEvent('schedule.task.resumed', {
      taskUuid: this.id,
      sourceModule: this._sourceModule,
      sourceEntityId: this._sourceEntityId,
      nextRunAt,
    });
  }

  /**
   * 完成任务
   */
  public complete(): void {
    this._status = ScheduleTaskStatus.Completed;
    this._updatedAt = new Date();

    // 发布事件
    this.addDomainEvent('schedule.task.completed', {
      taskUuid: this.id,
      sourceModule: this._sourceModule,
      sourceEntityId: this._sourceEntityId,
      totalExecutions: this._execution.executionCount,
    });
  }

  /**
   * 取消任务
   */
  public cancel(reason: string): void {
    if (this._status === ScheduleTaskStatus.Completed) {
      throw new Error('Cannot cancel a completed task');
    }
    this._status = ScheduleTaskStatus.Cancelled;
    this._updatedAt = new Date();

    // 发布事件
    this.addDomainEvent('schedule.task.cancelled', {
      taskUuid: this.id,
      sourceModule: this._sourceModule,
      sourceEntityId: this._sourceEntityId,
      reason,
    });
  }

  /**
   * 标记失败
   */
  public fail(error: string): void {
    this._status = ScheduleTaskStatus.Failed;
    this._updatedAt = new Date();

    // 发布事件
    this.addDomainEvent('schedule.task.failed', {
      taskUuid: this.id,
      sourceModule: this._sourceModule,
      sourceEntityId: this._sourceEntityId,
      error,
      consecutiveFailures: this._execution.consecutiveFailures,
    });
  }

  // ===== 调度配置管理 =====

  /**
   * 更新调度配置
   */
  public updateSchedule(schedule: Partial<any>): void {
    const oldCron = this._schedule.cronExpression;
    this._schedule = this._schedule.with(schedule);
    this._updatedAt = new Date();

    // 重新计算下次执行时间 (使用当前时间作为默认值)
    const nextRunAt = Date.now();
    this._execution = this._execution.with({ nextRunAt });

    // 发布事件
    this.addDomainEvent('schedule.task.schedule.updated', {
      taskUuid: this.id,
      previousCronExpression: oldCron,
      newCronExpression: this._schedule.cronExpression,
      nextRunAt,
    });
  }

  /**
   * 更新 Cron 表达�?
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
   * 3. 更新 nextRunAt（由外部 recordExecution 记录结果�?
   *
   * @returns 是否成功触发执行
   */
  public execute(): boolean {
    // 1. 检查任务是否可执行
    if (!this.canExecute()) {
      return false;
    }

    // 2. 发布领域事件（通知其他模块任务被触发）
    // 完整序列�?metadata DTO 以确保正确传�?
    const metadataDTO = this._metadata.toServerDTO();
    this.addDomainEvent('schedule.task.triggered', {
      taskUuid: this.id,
      taskName: this._name,
      sourceModule: this._sourceModule,
      sourceEntityId: this._sourceEntityId,
      executionTime: Date.now(),
      metadata: metadataDTO,
    });

    return true;
  }

  /**
   * 检查任务是否可执行
   */
  public canExecute(): boolean {
    // 任务必须是活跃状�?
    if (this._status !== ScheduleTaskStatus.Active) {
      return false;
    }

    // 任务必须启用
    if (!this._enabled) {
      return false;
    }

    // 检查是否到�?
    const now = Date.now();
    const nextRun = this._execution.nextRunAt;
    if (!nextRun || nextRun > now) {
      return false;
    }

    // 检查是否达到最大执行次�?
    const maxExecutions = this._schedule.maxExecutions;
    if (maxExecutions !== null && this._execution.executionCount >= maxExecutions) {
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
    this._execution = this._execution.updateAfterExecution({
      executedAt: Date.now(),
      status,
      duration,
      nextRunAt,
    });

    this._updatedAt = new Date();

    // 发布事件
    this.addDomainEvent('schedule.task.executed', {
      taskUuid: this.id,
      executionUuid: execution.uuid,
      sourceModule: this._sourceModule,
      sourceEntityId: this._sourceEntityId,
      status,
      duration,
      payload: this._metadata.toServerDTO().payload,
    });

    return execution;
  }

  /**
   * 更新执行信息
   */
  public updateExecutionInfo(updates: Partial<any>): void {
    this._execution = this._execution.with(updates);
    this._updatedAt = new Date();
  }

  /**
   * 重置失败计数
   */
  public resetFailures(): void {
    this._execution = this._execution.resetFailures();
    this._updatedAt = new Date();
  }

  // ===== 重试策略管理 =====

  /**
   * 更新重试策略
   */
  public updateRetryPolicy(policy: Partial<any>): void {
    this._retryPolicy = this._retryPolicy.with(policy);
    this._updatedAt = new Date();
  }

  /**
   * 判断是否应该重试
   */
  public shouldRetry(): boolean {
    const execInfo = this._execution;
    return this._retryPolicy.shouldRetry(execInfo.consecutiveFailures);
  }

  /**
   * 计算下次重试延迟
   */
  public calculateNextRetryDelay(): number {
    const execInfo = this._execution;
    return this._retryPolicy.calculateNextRetryDelay(execInfo.consecutiveFailures);
  }

  // ===== 元数据管�?=====

  /**
   * 更新元数�?
   */
  public updateMetadata(metadata: Partial<any>): void {
    this._metadata = this._metadata.with(metadata);
    this._updatedAt = new Date();
  }

  /**
   * 更新 Payload
   */
  public updatePayload(payload: Record<string, any>): void {
    this._metadata = this._metadata.setPayload(payload);
    this._updatedAt = new Date();
  }

  /**
   * 添加标签
   */
  public addTag(tag: string): void {
    this._metadata = this._metadata.addTag(tag);
    this._updatedAt = new Date();
  }

  /**
   * 移除标签
   */
  public removeTag(tag: string): void {
    this._metadata = this._metadata.removeTag(tag);
    this._updatedAt = new Date();
  }

  // ===== 启用/禁用 =====

  /**
   * 启用任务
   */
  public enable(): void {
    this._enabled = true;
    // 如果当前是暂停状态，自动切换为活跃
    if (this._status === ScheduleTaskStatus.Paused) {
      this._status = ScheduleTaskStatus.Active;
    }
    this._updatedAt = new Date();
  }

  /**
   * 禁用任务
   */
  public disable(): void {
    this._enabled = false;
    // 如果当前是活跃状态，自动切换为暂停
    if (this._status === ScheduleTaskStatus.Active) {
      this._status = ScheduleTaskStatus.Paused;
    }
    this._updatedAt = new Date();
  }

  // ===== 状态检�?=====

  public isActive(): boolean {
    return this._status === ScheduleTaskStatus.Active;
  }

  public isPaused(): boolean {
    return this._status === ScheduleTaskStatus.Paused;
  }

  public isCompleted(): boolean {
    return this._status === ScheduleTaskStatus.Completed;
  }

  public isCancelled(): boolean {
    return this._status === ScheduleTaskStatus.Cancelled;
  }

  public isFailed(): boolean {
    return this._status === ScheduleTaskStatus.Failed;
  }

  public isExpired(): boolean {
    return this._schedule.isExpired;
  }

  // ===== UI 辅助方法 =====

  /**
   * 获取状态显示文�?
   */
  public getStatusDisplay(): string {
    const statusMap: Record<ScheduleTaskStatus, string> = {
      [ScheduleTaskStatus.Active]: '活跃',
      [ScheduleTaskStatus.Paused]: '暂停',
      [ScheduleTaskStatus.Completed]: '完成',
      [ScheduleTaskStatus.Cancelled]: '取消',
      [ScheduleTaskStatus.Failed]: '失败',
    };
    return statusMap[this._status] || this._status;
  }

  /**
   * 获取状态颜�?
   */
  public getStatusColor(): string {
    const colorMap: Record<ScheduleTaskStatus, string> = {
      [ScheduleTaskStatus.Active]: 'green',
      [ScheduleTaskStatus.Paused]: 'gray',
      [ScheduleTaskStatus.Completed]: 'blue',
      [ScheduleTaskStatus.Cancelled]: 'red',
      [ScheduleTaskStatus.Failed]: 'orange',
    };
    return colorMap[this._status] || 'gray';
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
    return moduleMap[this._sourceModule] || this._sourceModule;
  }

  /**
   * 格式化下次运行时�?
   */
  public getNextRunAtFormatted(): string {
    if (!this._execution.nextRunAt) return '-';
    const date = new Date(this._execution.nextRunAt);
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
   * 格式化上次运行时�?
   */
  public getLastRunAtFormatted(): string {
    if (!this._execution.lastRunAt) return '-';
    const date = new Date(this._execution.lastRunAt);
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
    const count = this._execution.executionCount;
    const failures = this._execution.consecutiveFailures;
    const successCount = count - failures;
    return `已执�?${count} 次，成功 ${successCount} 次`;
  }

  /**
   * 获取健康状�?
   */
  public getHealthStatus(): string {
    const failures = this._execution.consecutiveFailures;
    if (failures === 0) return 'healthy';
    if (failures < 3) return 'warning';
    return 'critical';
  }

  /**
   * 检查是否过�?
   */
  public isOverdue(): boolean {
    if (!this._execution.nextRunAt) return false;
    return this._execution.nextRunAt < Date.now();
  }

  // ===== 转换方法 =====

  /**
   * 转换�?Server DTO
   */
  public toServerDTO(includeChildren: boolean = false): ScheduleTaskServerDTO {
    return {
      uuid: this.id,
      accountUuid: this._identityId,
      name: this._name,
      description: this._description,
      sourceModule: this._sourceModule,
      sourceEntityId: this._sourceEntityId,
      status: this._status,
      enabled: this._enabled,
      schedule: this._schedule.toServerDTO(),
      execution: this._execution.toServerDTO(),
      retryPolicy: this._retryPolicy.toServerDTO(),
      metadata: this._metadata.toServerDTO(),
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      executions: includeChildren ? this._executions.map((e) => e.toServerDTO()) : undefined,
    };
  }

  /**
   * 转换为 Client DTO (用于客户端)
   */
  public toClientDTO(includeChildren: boolean = false): ScheduleTaskClientDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      name: this._name,
      description: this._description,
      sourceModule: this._sourceModule,
      sourceEntityId: this._sourceEntityId,
      status: this._status,
      enabled: this._enabled,
      schedule: this._schedule.toServerDTO() as any,
      execution: this._execution.toServerDTO() as any,
      retryPolicy: this._retryPolicy.toServerDTO() as any,
      metadata: this._metadata.toServerDTO() as any,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
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
   * 转换为持久化 DTO（全部使�?camelCase�?
   */
  public toPersistenceDTO(): ScheduleTaskPersistenceDTO {
    const scheduleDTO = this._schedule.toServerDTO();
    const executionDTO = this._execution.toServerDTO();
    const retryPolicyDTO = this._retryPolicy.toServerDTO();
    const metadataDTO = this._metadata.toServerDTO();

    return {
      uuid: this.id,
      accountUuid: this._identityId,
      name: this._name,
      description: this._description,
      sourceModule: this._sourceModule,
      sourceEntityId: this._sourceEntityId,
      status: this._status,
      enabled: this._enabled,
      // ScheduleConfig (flattened)
      cronExpression: this._schedule.cronExpression,
      timezone: this._schedule.timezone,
      startDate: this._schedule.startDate !== null ? new Date(this._schedule.startDate) : null,
      endDate: this._schedule.endDate !== null ? new Date(this._schedule.endDate) : null,
      maxExecutions: this._schedule.maxExecutions,
      // ExecutionInfo (flattened)
      nextRunAt: this._execution.nextRunAt !== null ? new Date(this._execution.nextRunAt) : null,
      lastRunAt: this._execution.lastRunAt !== null ? new Date(this._execution.lastRunAt) : null,
      executionCount: this._execution.executionCount,
      lastExecutionStatus: this._execution.lastExecutionStatus
        ? String(this._execution.lastExecutionStatus)
        : null,
      lastExecutionDuration: this._execution.lastExecutionDuration,
      consecutiveFailures: this._execution.consecutiveFailures,
      // RetryPolicy (flattened)
      maxRetries: this._retryPolicy.maxRetries,
      initialDelayMs: this._retryPolicy.retryDelay,
      maxDelayMs: this._retryPolicy.maxRetryDelay,
      backoffMultiplier: this._retryPolicy.backoffMultiplier,
      retryableStatuses: '[]',
      // TaskMetadata (flattened)
      payload: metadataDTO.payload,
      tags: JSON.stringify(metadataDTO.tags),
      priority: metadataDTO.priority,
      timeout: metadataDTO.timeout,
      // Timestamps
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  // ===== 静态工厂方�?=====

  /**
   * 创建新任�?
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
    });

    // 发布创建事件
    task.addDomainEvent('schedule.task.created', {
      taskUuid: task.uuid,
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
      uuid: dto.uuid,
      identityId: dto.accountUuid,
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
      uuid: dto.uuid,
      identityId: dto.accountUuid,
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
      uuid: dto.uuid,
      identityId: dto.accountUuid,
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
    });
  }
}
