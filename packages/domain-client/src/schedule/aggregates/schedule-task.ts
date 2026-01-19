/**
 * ScheduleTask 聚合根实现 (Client)
 * 兼容 ScheduleTaskClient 接口
 *
 * **严格参考 Repository 模块和 domain-server 规范**
 */

import type { ExecutionInfoClientDTO, ScheduleTaskClient, ScheduleTaskClientDTO, ScheduleTaskServerDTO } from '@dailyuse/contracts/schedule';
import { ExecutionStatus, ScheduleTaskStatus, SourceModule, TaskPriority, Timezone } from '@dailyuse/contracts/schedule';
import { AggregateRoot } from '@dailyuse/utils';
import { ScheduleConfig, RetryPolicy, ExecutionInfo, TaskMetadata } from '../value-objects';

/**
 * ScheduleTask 聚合根 (Client)
 *
 * DDD 聚合根职责：
 * - 管理聚合内的所有实体
 * - 执行业务逻辑
 * - 确保聚合内的一致性
 * - 是事务边界
 */
export class ScheduleTask extends AggregateRoot implements ScheduleTaskClient {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _name: string;
  private _description: string | null;
  private _sourceModule: SourceModule;
  private _sourceEntityId: string;
  private _status: ScheduleTaskStatus;
  private _enabled: boolean;
  private _schedule: ScheduleConfig;
  private _execution: ExecutionInfo; // ⭐ 改名为 _execution
  private _retryPolicy: RetryPolicy;
  private _metadata: TaskMetadata;
  private _createdAt: number;
  private _updatedAt: number;

  // ===== 子实体集合 =====
  // 注意：根据 contracts 定义，可能需要管理 ScheduleExecution 子实体
  // private _executions: ScheduleExecution[];

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    name: string;
    description?: string | null;
    sourceModule: SourceModule;
    sourceEntityId: string;
    status: ScheduleTaskStatus;
    enabled: boolean;
    schedule: ScheduleConfig;
    execution: ExecutionInfo; // ⭐ 改名为 execution
    retryPolicy: RetryPolicy;
    metadata: TaskMetadata;
    createdAt: number;
    updatedAt: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
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
    // this._executions = [];
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
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
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }

  // ⭐ 子实体访问（根据 contracts 定义）
  public get executions(): any[] | null {
    // TODO: 实现子实体管理
    return null;
  }

  // ===== UI 辅助属性 =====

  public get statusDisplay(): string {
    const labels: Record<ScheduleTaskStatus, string> = {
      [ScheduleTaskStatus.ACTIVE]: '活跃',
      [ScheduleTaskStatus.PAUSED]: '已暂停',
      [ScheduleTaskStatus.COMPLETED]: '已完成',
      [ScheduleTaskStatus.FAILED]: '失败',
      [ScheduleTaskStatus.CANCELLED]: '已取消',
    };
    return labels[this._status] || this._status;
  }

  public get statusColor(): string {
    const colors: Record<ScheduleTaskStatus, string> = {
      [ScheduleTaskStatus.ACTIVE]: 'green',
      [ScheduleTaskStatus.PAUSED]: 'gray',
      [ScheduleTaskStatus.COMPLETED]: 'blue',
      [ScheduleTaskStatus.FAILED]: 'red',
      [ScheduleTaskStatus.CANCELLED]: 'orange',
    };
    return colors[this._status] || 'gray';
  }

  public get sourceModuleDisplay(): string {
    const labels: Record<SourceModule, string> = {
      [SourceModule.REMINDER]: '提醒模块',
      [SourceModule.TASK]: '任务模块',
      [SourceModule.GOAL]: '目标模块',
      [SourceModule.NOTIFICATION]: '通知模块',
      [SourceModule.SYSTEM]: '系统模块',
      [SourceModule.CUSTOM]: '自定义模块',
    };
    return labels[this._sourceModule] || this._sourceModule;
  }

  public get enabledDisplay(): string {
    return this._enabled ? '启用' : '禁用';
  }

  public get nextRunAtFormatted(): string {
    // ⭐ 必须返回 string，不能是 null
    if (!this._execution.nextRunAt) return '未安排';
    return this.formatRelativeTime(this._execution.nextRunAt.getTime());
  }

  public get lastRunAtFormatted(): string {
    // ⭐ 必须返回 string，不能是 null
    if (!this._execution.lastRunAt) return '从未执行';
    return this.formatRelativeTime(this._execution.lastRunAt.getTime());
  }

  public get executionSummary(): string {
    const total = this._execution.executionCount;
    if (total === 0) return '尚未执行';

    // 注意：这里需要计算成功次数，暂时简化处理
    const failures = this._execution.consecutiveFailures;
    const success = Math.max(0, total - failures);
    return `已执行 ${total} 次，成功 ${success} 次`;
  }

  public get healthStatus(): string {
    const failures = this._execution.consecutiveFailures;
    if (failures === 0) return 'healthy';
    if (failures < 3) return 'warning';
    return 'critical';
  }

  public get isOverdue(): boolean {
    if (!this._execution.nextRunAt) return false;
    return this._execution.nextRunAt.getTime() < Date.now();
  }

  public get formattedCreatedAt(): string {
    return this.formatDate(this._createdAt);
  }

  public get formattedUpdatedAt(): string {
    return this.formatDate(this._updatedAt);
  }

  // ===== 业务方法（⭐ 是方法，不是 getter）=====

  public isActive(): boolean {
    return this._status === ScheduleTaskStatus.ACTIVE && this._enabled;
  }

  public isPaused(): boolean {
    return this._status === ScheduleTaskStatus.PAUSED || !this._enabled;
  }

  public isCompleted(): boolean {
    return this._status === ScheduleTaskStatus.COMPLETED;
  }

  public isFailed(): boolean {
    return this._status === ScheduleTaskStatus.FAILED;
  }

  public isCancelled(): boolean {
    return this._status === ScheduleTaskStatus.CANCELLED;
  }

  public canPause(): boolean {
    return this._status === ScheduleTaskStatus.ACTIVE;
  }

  public canResume(): boolean {
    return this._status === ScheduleTaskStatus.PAUSED;
  }

  public canExecute(): boolean {
    if (!this.isActive()) return false;
    if (!this._execution.nextRunAt) return false;
    return this._execution.nextRunAt.getTime() <= Date.now();
  }

  public isExpired(): boolean {
    // 检查是否过期（根据 schedule 的 endDate）
    const endDate = this._schedule.endDate;
    if (!endDate) return false;
    return endDate.getTime() < Date.now();
  }

  // ===== 子实体访问方法 =====

  public getRecentExecutions(limit: number): any[] {
    // TODO: 实现子实体管理后返回实际数据
    return [];
  }

  public getFailedExecutions(): any[] {
    // TODO: 实现子实体管理后返回实际数据
    return [];
  }

  // ===== 格式化辅助方法 =====

  private formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('zh-CN');
  }

  private formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = timestamp - now;
    const absDiff = Math.abs(diff);
    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (diff > 0) {
      // 未来时间
      if (days > 0) return `${days}天后`;
      if (hours > 0) return `${hours}小时后`;
      if (minutes > 0) return `${minutes}分钟后`;
      return '即将执行';
    } else {
      // 过去时间
      if (days > 0) return `${days}天前`;
      if (hours > 0) return `${hours}小时前`;
      if (minutes > 0) return `${minutes}分钟前`;
      return '刚刚';
    }
  }

  // ===== 工厂方法 =====

  /**
   * 创建一个空的 ScheduleTask 实例（用于新建表单）
   */
  public static forCreate(accountUuid: string, sourceModule: SourceModule): ScheduleTask {
    const now = Date.now();
    return new ScheduleTask({
      accountUuid,
      name: '',
      description: null,
      sourceModule,
      sourceEntityId: '',
      status: ScheduleTaskStatus.ACTIVE,
      enabled: true,
      schedule: ScheduleConfig.createDefault(),
      execution: ExecutionInfo.createDefault(),
      retryPolicy: RetryPolicy.createDefault(),
      metadata: TaskMetadata.createDefault(),
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 克隆当前对象（深拷贝）
   * 用于表单编辑时避免直接修改原数据
   */
  public clone(): ScheduleTask {
    return ScheduleTask.fromClientDTO(this.toClientDTO());
  }

  /**
   * 创建新的 ScheduleTask 聚合根
   */
  public static create(params: {
    accountUuid: string;
    name: string;
    description?: string;
    sourceModule: SourceModule;
    sourceEntityId: string;
    cronExpression: string;
    timezone?: Timezone;
    tags?: string[];
  }): ScheduleTask {
    const uuid = AggregateRoot.generateUUID();
    const now = Date.now();

    const schedule = new ScheduleConfig({
      cronExpression: params.cronExpression,
      timezone: (params.timezone || 'Asia/Shanghai') as Timezone,
      startDate: null,
      endDate: null,
      maxExecutions: null,
    });

    const execution = ExecutionInfo.createDefault();
    const retryPolicy = RetryPolicy.createDefault();
    const metadata = new TaskMetadata({
      tags: params.tags || [],
      priority: 'normal' as TaskPriority,
      timeout: null,
      payload: {},
    });

    return new ScheduleTask({
      uuid,
      accountUuid: params.accountUuid,
      name: params.name,
      description: params.description,
      sourceModule: params.sourceModule,
      sourceEntityId: params.sourceEntityId,
      status: ScheduleTaskStatus.ACTIVE,
      enabled: true,
      schedule,
      execution,
      retryPolicy,
      metadata,
      createdAt: now,
      updatedAt: now,
    });
  }

  // ===== 状态转换方法（返回 ScheduleTask，符合 contracts）=====

  /**
   * 暂停任务
   */
  public pause(): ScheduleTask {
    if (!this.canPause()) {
      throw new Error('当前状态无法暂停任务');
    }
    const cloned = this.clone();
    cloned._status = ScheduleTaskStatus.PAUSED;
    cloned._updatedAt = Date.now();
    return cloned;
  }

  /**
   * 恢复任务
   */
  public resume(): ScheduleTask {
    if (!this.canResume()) {
      throw new Error('只有暂停的任务才能恢复');
    }
    const cloned = this.clone();
    cloned._status = ScheduleTaskStatus.ACTIVE;
    cloned._updatedAt = Date.now();
    return cloned;
  }

  /**
   * 取消任务
   */
  public cancel(): ScheduleTask {
    if (
      this._status === ScheduleTaskStatus.COMPLETED ||
      this._status === ScheduleTaskStatus.CANCELLED
    ) {
      throw new Error('已完成或已取消的任务不能再取消');
    }
    const cloned = this.clone();
    cloned._status = ScheduleTaskStatus.CANCELLED;
    cloned._enabled = false;
    cloned._updatedAt = Date.now();
    return cloned;
  }

  /**
   * 完成任务
   */
  public complete(): ScheduleTask {
    if (this._status !== ScheduleTaskStatus.ACTIVE) {
      throw new Error('只有活跃的任务才能标记为完成');
    }
    const cloned = this.clone();
    cloned._status = ScheduleTaskStatus.COMPLETED;
    cloned._enabled = false;
    cloned._updatedAt = Date.now();
    return cloned;
  }

  /**
   * 更新执行信息
   */
  public updateExecution(execution: ExecutionInfoClientDTO): ScheduleTask {
    const cloned = this.clone();
    cloned._execution = ExecutionInfo.fromClientDTO(execution);
    cloned._updatedAt = Date.now();
    return cloned;
  }

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): ScheduleTaskServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      sourceModule: this._sourceModule,
      sourceEntityId: this._sourceEntityId,
      status: this._status,
      enabled: this._enabled,
      schedule: this._schedule.toServerDTO(),
      execution: this._execution.toServerDTO(), // ⭐ execution
      retryPolicy: this._retryPolicy.toServerDTO(),
      metadata: this._metadata.toServerDTO(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): ScheduleTaskClientDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      name: this._name,
      description: this._description,
      sourceModule: this._sourceModule,
      sourceEntityId: this._sourceEntityId,
      status: this._status,
      enabled: this._enabled,
      schedule: this._schedule.toClientDTO(),
      execution: this._execution.toClientDTO(), // ⭐ execution
      retryPolicy: this._retryPolicy.toClientDTO(),
      metadata: this._metadata.toClientDTO(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,

      // UI 辅助属性
      statusDisplay: this.statusDisplay,
      statusColor: this.statusColor,
      sourceModuleDisplay: this.sourceModuleDisplay,
      enabledDisplay: this.enabledDisplay,
      nextRunAtFormatted: this.nextRunAtFormatted,
      lastRunAtFormatted: this.lastRunAtFormatted,
      executionSummary: this.executionSummary,
      healthStatus: this.healthStatus,
      isOverdue: this.isOverdue,

      // 子实体（可选）
      executions: this.executions,
    };
  }

  // ===== 转换方法 (From - 静态工厂) =====

  /**
   * 从 Server DTO 创建实体
   */
  public static fromServerDTO(dto: ScheduleTaskServerDTO): ScheduleTask {
    const task = new ScheduleTask({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      sourceModule: dto.sourceModule,
      sourceEntityId: dto.sourceEntityId,
      status: dto.status,
      enabled: dto.enabled,
      schedule: ScheduleConfig.fromServerDTO(dto.schedule),
      execution: ExecutionInfo.fromServerDTO(dto.execution), // ⭐ execution
      retryPolicy: RetryPolicy.fromServerDTO(dto.retryPolicy),
      metadata: TaskMetadata.fromServerDTO(dto.metadata),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });

    // 递归创建子实体（如果有）
    // if (dto.executions) {
    //   task._executions = dto.executions.map((e) => ScheduleExecution.fromServerDTO(e));
    // }

    return task;
  }

  /**
   * 从 Client DTO 创建实体
   */
  public static fromClientDTO(dto: ScheduleTaskClientDTO): ScheduleTask {
    const task = new ScheduleTask({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      name: dto.name,
      description: dto.description,
      sourceModule: dto.sourceModule,
      sourceEntityId: dto.sourceEntityId,
      status: dto.status,
      enabled: dto.enabled,
      schedule: ScheduleConfig.fromClientDTO(dto.schedule),
      execution: ExecutionInfo.fromClientDTO(dto.execution), // ⭐ execution
      retryPolicy: RetryPolicy.fromClientDTO(dto.retryPolicy),
      metadata: TaskMetadata.fromClientDTO(dto.metadata),
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });

    // 递归创建子实体（如果有）
    // if (dto.executions) {
    //   task._executions = dto.executions.map((e) => ScheduleExecution.fromClientDTO(e));
    // }

    return task;
  }
}
