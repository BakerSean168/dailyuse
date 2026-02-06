/**
 * ScheduleTask Aggregate Root - Domain Client
 * 调度任务聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 ScheduleTaskClient 接口
 * - Private constructor with params object
 * - Private _field backing fields
 * - Public getters
 * - Static fromDTO(dto: ScheduleTaskClientDTO): ScheduleTask
 * - Instance toDTO(): ScheduleTaskClientDTO
 */

import type {
  ScheduleTaskClient,
  ScheduleTaskClientDTO,
  ScheduleConfigClient,
  ScheduleConfigClientDTO,
  ExecutionInfoClient,
  ExecutionInfoClientDTO,
  RetryPolicyClient,
  RetryPolicyClientDTO,
  TaskMetadataClient,
  TaskMetadataClientDTO,
  ScheduleTaskStatus,
  SourceModule,
  ScheduleExecutionClient,
  ScheduleExecutionClientDTO,
  Timezone,
  TaskPriority,
  ExecutionStatus,
} from '@dailyuse/contracts/schedule';
import { AggregateRoot } from '@dailyuse/utils';
import { ScheduleTaskId } from '@dailyuse/domain-shared/schedule';
import { IdentityId } from '@dailyuse/domain-shared';
import { ScheduleExecution } from '../entities/schedule-execution.js';

// ============ Value Object Wrappers ============

/**
 * ScheduleConfig 值对象包装
 */
class ScheduleConfigVO implements ScheduleConfigClient {
  constructor(private readonly dto: ScheduleConfigClientDTO) {}

  get cronExpression(): string {
    return this.dto.cronExpression;
  }

  get timezone(): Timezone {
    return this.dto.timezone;
  }

  get startDate(): Date | null {
    return this.dto.startDate ? new Date(this.dto.startDate) : null;
  }

  get endDate(): Date | null {
    return this.dto.endDate ? new Date(this.dto.endDate) : null;
  }

  get maxExecutions(): number | null {
    return this.dto.maxExecutions;
  }

  get cronDescription(): string {
    return this.dto.cronDescription;
  }

  get timezoneDisplay(): string {
    return this.dto.timezoneDisplay;
  }

  get startDateFormatted(): string | null {
    return this.dto.startDateFormatted;
  }

  get endDateFormatted(): string | null {
    return this.dto.endDateFormatted;
  }

  get maxExecutionsFormatted(): string {
    return this.dto.maxExecutionsFormatted;
  }

  toDTO(): ScheduleConfigClientDTO {
    return { ...this.dto };
  }
}

/**
 * ExecutionInfo 值对象包装
 */
class ExecutionInfoVO implements ExecutionInfoClient {
  constructor(private readonly dto: ExecutionInfoClientDTO) {}

  get nextRunAt(): Date | null {
    return this.dto.nextRunAt ? new Date(this.dto.nextRunAt) : null;
  }

  get lastRunAt(): Date | null {
    return this.dto.lastRunAt ? new Date(this.dto.lastRunAt) : null;
  }

  get executionCount(): number {
    return this.dto.executionCount;
  }

  get lastExecutionStatus(): ExecutionStatus | null {
    return this.dto.lastExecutionStatus;
  }

  get consecutiveFailures(): number {
    return this.dto.consecutiveFailures;
  }

  get nextRunAtFormatted(): string | null {
    return this.dto.nextRunAtFormatted;
  }

  get lastRunAtFormatted(): string | null {
    return this.dto.lastRunAtFormatted;
  }

  get lastExecutionDurationFormatted(): string | null {
    return this.dto.lastExecutionDurationFormatted;
  }

  get executionCountFormatted(): string {
    return this.dto.executionCountFormatted;
  }

  get healthStatus(): 'healthy' | 'warning' | 'critical' {
    return this.dto.healthStatus;
  }

  toDTO(): ExecutionInfoClientDTO {
    return { ...this.dto };
  }
}

/**
 * RetryPolicy 值对象包装
 */
class RetryPolicyVO implements RetryPolicyClient {
  constructor(private readonly dto: RetryPolicyClientDTO) {}

  get enabled(): boolean {
    return this.dto.enabled;
  }

  get maxRetries(): number {
    return this.dto.maxRetries;
  }

  get retryDelay(): number {
    return this.dto.retryDelay;
  }

  get backoffMultiplier(): number {
    return this.dto.backoffMultiplier;
  }

  get maxRetryDelay(): number {
    return this.dto.maxRetryDelay;
  }

  get policyDescription(): string {
    return this.dto.policyDescription;
  }

  get enabledDisplay(): string {
    return this.dto.enabledDisplay;
  }

  get retryDelayFormatted(): string {
    return this.dto.retryDelayFormatted;
  }

  get maxRetryDelayFormatted(): string {
    return this.dto.maxRetryDelayFormatted;
  }

  toDTO(): RetryPolicyClientDTO {
    return { ...this.dto };
  }
}

/**
 * TaskMetadata 值对象包装
 */
class TaskMetadataVO implements TaskMetadataClient {
  constructor(private readonly dto: TaskMetadataClientDTO) {}

  get payload(): Record<string, any> {
    return { ...this.dto.payload };
  }

  get tags(): string[] {
    return [...this.dto.tags];
  }

  get priority(): TaskPriority {
    return this.dto.priority;
  }

  get timeout(): number | null {
    return this.dto.timeout;
  }

  get priorityDisplay(): string {
    return this.dto.priorityDisplay;
  }

  get priorityColor(): string {
    return this.dto.priorityColor;
  }

  get tagsDisplay(): string {
    return this.dto.tagsDisplay;
  }

  get timeoutFormatted(): string {
    return this.dto.timeoutFormatted;
  }

  get payloadSummary(): string {
    return this.dto.payloadSummary;
  }

  toDTO(): TaskMetadataClientDTO {
    return { ...this.dto };
  }
}

// ============ Aggregate Root ============

export class ScheduleTask extends AggregateRoot<ScheduleTaskId> implements ScheduleTaskClient {
  // ================= 1. Backing Fields =================
  private _identityId: IdentityId;
  private _name: string;
  private _description: string | null;
  private _sourceModule: SourceModule;
  private _sourceEntityId: string;
  private _status: ScheduleTaskStatus;
  private _enabled: boolean;

  // 值对象
  private _schedule: ScheduleConfigVO;
  private _execution: ExecutionInfoVO;
  private _retryPolicy: RetryPolicyVO;
  private _metadata: TaskMetadataVO;

  // 同步字段
  private _version: number;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // UI 辅助属性
  private _statusDisplay: string;
  private _statusColor: string;
  private _sourceModuleDisplay: string;
  private _enabledDisplay: string;
  private _nextRunAtFormatted: string;
  private _lastRunAtFormatted: string;
  private _executionSummary: string;
  private _healthStatus: string;
  private _isOverdue: boolean;

  // 子实体
  private _executions: ScheduleExecution[] | null;

  // ================= 2. Constructor (Private) =================
  private constructor(params: {
    id: ScheduleTaskId;
    identityId: IdentityId;
    name: string;
    description: string | null;
    sourceModule: SourceModule;
    sourceEntityId: string;
    status: ScheduleTaskStatus;
    enabled: boolean;
    schedule: ScheduleConfigVO;
    execution: ExecutionInfoVO;
    retryPolicy: RetryPolicyVO;
    metadata: TaskMetadataVO;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    statusDisplay: string;
    statusColor: string;
    sourceModuleDisplay: string;
    enabledDisplay: string;
    nextRunAtFormatted: string;
    lastRunAtFormatted: string;
    executionSummary: string;
    healthStatus: string;
    isOverdue: boolean;
    executions: ScheduleExecution[] | null;
  }) {
    super(params.id);
    this._identityId = params.identityId;
    this._name = params.name;
    this._description = params.description;
    this._sourceModule = params.sourceModule;
    this._sourceEntityId = params.sourceEntityId;
    this._status = params.status;
    this._enabled = params.enabled;
    this._schedule = params.schedule;
    this._execution = params.execution;
    this._retryPolicy = params.retryPolicy;
    this._metadata = params.metadata;
    this._version = params.version;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
    this._statusDisplay = params.statusDisplay;
    this._statusColor = params.statusColor;
    this._sourceModuleDisplay = params.sourceModuleDisplay;
    this._enabledDisplay = params.enabledDisplay;
    this._nextRunAtFormatted = params.nextRunAtFormatted;
    this._lastRunAtFormatted = params.lastRunAtFormatted;
    this._executionSummary = params.executionSummary;
    this._healthStatus = params.healthStatus;
    this._isOverdue = params.isOverdue;
    this._executions = params.executions;
  }

  // ================= 3. Getters =================
  get identityId(): IdentityId {
    return this._identityId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get sourceModule(): SourceModule {
    return this._sourceModule;
  }

  get sourceEntityId(): string {
    return this._sourceEntityId;
  }

  get status(): ScheduleTaskStatus {
    return this._status;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  // 值对象
  get schedule(): ScheduleConfigClient {
    return this._schedule;
  }

  get execution(): ExecutionInfoClient {
    return this._execution;
  }

  get retryPolicy(): RetryPolicyClient {
    return this._retryPolicy;
  }

  get metadata(): TaskMetadataClient {
    return this._metadata;
  }

  // 同步字段
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
  get statusDisplay(): string {
    return this._statusDisplay;
  }

  get statusColor(): string {
    return this._statusColor;
  }

  get sourceModuleDisplay(): string {
    return this._sourceModuleDisplay;
  }

  get enabledDisplay(): string {
    return this._enabledDisplay;
  }

  get nextRunAtFormatted(): string {
    return this._nextRunAtFormatted;
  }

  get lastRunAtFormatted(): string {
    return this._lastRunAtFormatted;
  }

  get executionSummary(): string {
    return this._executionSummary;
  }

  get healthStatus(): string {
    return this._healthStatus;
  }

  get isOverdue(): boolean {
    return this._isOverdue;
  }

  // 子实体
  get executions(): ScheduleExecutionClient[] | null {
    return this._executions ? [...this._executions] : null;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._deletedAt !== null;
  }

  get isActive(): boolean {
    return this._status === 'Active' && this._enabled;
  }

  get isPaused(): boolean {
    return this._status === 'Paused';
  }

  get isCompleted(): boolean {
    return this._status === 'Completed';
  }

  get isCancelled(): boolean {
    return this._status === 'Cancelled';
  }

  get isFailed(): boolean {
    return this._status === 'Failed';
  }

  // ================= 4. Factory Methods =================
  public static fromDTO(dto: ScheduleTaskClientDTO): ScheduleTask {
    return new ScheduleTask({
      id: ScheduleTaskId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      name: dto.name,
      description: dto.description,
      sourceModule: dto.sourceModule,
      sourceEntityId: dto.sourceEntityId,
      status: dto.status,
      enabled: dto.enabled,
      schedule: new ScheduleConfigVO(dto.schedule),
      execution: new ExecutionInfoVO(dto.execution),
      retryPolicy: new RetryPolicyVO(dto.retryPolicy),
      metadata: new TaskMetadataVO(dto.metadata),
      version: dto.version,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      statusDisplay: dto.statusDisplay,
      statusColor: dto.statusColor,
      sourceModuleDisplay: dto.sourceModuleDisplay,
      enabledDisplay: dto.enabledDisplay,
      nextRunAtFormatted: dto.nextRunAtFormatted,
      lastRunAtFormatted: dto.lastRunAtFormatted,
      executionSummary: dto.executionSummary,
      healthStatus: dto.healthStatus,
      isOverdue: dto.isOverdue,
      executions: dto.executions
        ? dto.executions.map((e) => ScheduleExecution.fromDTO(e))
        : null,
    });
  }

  // ================= 5. DTO Conversion =================
  public toDTO(): ScheduleTaskClientDTO {
    return {
      id: String(this.id),
      identityId: String(this._identityId),
      name: this._name,
      description: this._description,
      sourceModule: this._sourceModule,
      sourceEntityId: this._sourceEntityId,
      status: this._status,
      enabled: this._enabled,
      schedule: this._schedule.toDTO(),
      execution: this._execution.toDTO(),
      retryPolicy: this._retryPolicy.toDTO(),
      metadata: this._metadata.toDTO(),
      version: this._version,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      statusDisplay: this._statusDisplay,
      statusColor: this._statusColor,
      sourceModuleDisplay: this._sourceModuleDisplay,
      enabledDisplay: this._enabledDisplay,
      nextRunAtFormatted: this._nextRunAtFormatted,
      lastRunAtFormatted: this._lastRunAtFormatted,
      executionSummary: this._executionSummary,
      healthStatus: this._healthStatus,
      isOverdue: this._isOverdue,
      executions: this._executions
        ? this._executions.map((e) => e.toDTO())
        : null,
    };
  }
}
