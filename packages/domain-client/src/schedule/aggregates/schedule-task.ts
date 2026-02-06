/**
 * ScheduleTask Aggregate Root - Domain Client
 * 调度任务聚合根 - 领域客户端
 *
 * 【规范说明】
 * - 实现 ScheduleTaskClient 接口
 * - Private constructor with props object
 * - Public getters via this._props.xxx
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

// 内部状态接口
interface ScheduleTaskState {
  id: ScheduleTaskId;
  identityId: IdentityId;
  name: string;
  description: string | null;
  sourceModule: SourceModule;
  sourceEntityId: string;
  status: ScheduleTaskStatus;
  enabled: boolean;
  schedule: ScheduleConfigClient;
  execution: ExecutionInfoClient;
  retryPolicy: RetryPolicyClient;
  metadata: TaskMetadataClient;
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
}

export class ScheduleTask extends AggregateRoot<ScheduleTaskId> implements ScheduleTaskClient {
  private readonly _props: ScheduleTaskState;

  private constructor(props: ScheduleTaskState) {
    super(props.id);
    this._props = props;
  }

  // ================= Getters =================
  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get name(): string {
    return this._props.name;
  }

  get description(): string | null {
    return this._props.description;
  }

  get sourceModule(): SourceModule {
    return this._props.sourceModule;
  }

  get sourceEntityId(): string {
    return this._props.sourceEntityId;
  }

  get status(): ScheduleTaskStatus {
    return this._props.status;
  }

  get enabled(): boolean {
    return this._props.enabled;
  }

  // 值对象
  get schedule(): ScheduleConfigClient {
    return this._props.schedule;
  }

  get execution(): ExecutionInfoClient {
    return this._props.execution;
  }

  get retryPolicy(): RetryPolicyClient {
    return this._props.retryPolicy;
  }

  get metadata(): TaskMetadataClient {
    return this._props.metadata;
  }

  // 同步字段
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
  get statusDisplay(): string {
    return this._props.statusDisplay;
  }

  get statusColor(): string {
    return this._props.statusColor;
  }

  get sourceModuleDisplay(): string {
    return this._props.sourceModuleDisplay;
  }

  get enabledDisplay(): string {
    return this._props.enabledDisplay;
  }

  get nextRunAtFormatted(): string {
    return this._props.nextRunAtFormatted;
  }

  get lastRunAtFormatted(): string {
    return this._props.lastRunAtFormatted;
  }

  get executionSummary(): string {
    return this._props.executionSummary;
  }

  get healthStatus(): string {
    return this._props.healthStatus;
  }

  get isOverdue(): boolean {
    return this._props.isOverdue;
  }

  // 子实体
  get executions(): ScheduleExecutionClient[] | null {
    return this._props.executions ? [...this._props.executions] : null;
  }

  // UI 计算属性
  get isDeleted(): boolean {
    return this._props.deletedAt !== null;
  }

  get isActive(): boolean {
    return this._props.status === 'Active' && this._props.enabled;
  }

  get isPaused(): boolean {
    return this._props.status === 'Paused';
  }

  get isCompleted(): boolean {
    return this._props.status === 'Completed';
  }

  get isCancelled(): boolean {
    return this._props.status === 'Cancelled';
  }

  get isFailed(): boolean {
    return this._props.status === 'Failed';
  }

  // ================= Factory Methods =================
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

  // ================= DTO Conversion =================
  public toDTO(): ScheduleTaskClientDTO {
    return {
      id: String(this._props.id),
      identityId: String(this._props.identityId),
      name: this._props.name,
      description: this._props.description,
      sourceModule: this._props.sourceModule,
      sourceEntityId: this._props.sourceEntityId,
      status: this._props.status,
      enabled: this._props.enabled,
      schedule: (this._props.schedule as ScheduleConfigVO).toDTO(),
      execution: (this._props.execution as ExecutionInfoVO).toDTO(),
      retryPolicy: (this._props.retryPolicy as RetryPolicyVO).toDTO(),
      metadata: (this._props.metadata as TaskMetadataVO).toDTO(),
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      statusDisplay: this._props.statusDisplay,
      statusColor: this._props.statusColor,
      sourceModuleDisplay: this._props.sourceModuleDisplay,
      enabledDisplay: this._props.enabledDisplay,
      nextRunAtFormatted: this._props.nextRunAtFormatted,
      lastRunAtFormatted: this._props.lastRunAtFormatted,
      executionSummary: this._props.executionSummary,
      healthStatus: this._props.healthStatus,
      isOverdue: this._props.isOverdue,
      executions: this._props.executions
        ? (this._props.executions as ScheduleExecution[]).map((e) => e.toDTO())
        : null,
    };
  }
}
