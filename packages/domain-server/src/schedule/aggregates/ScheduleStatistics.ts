import { AggregateRoot } from '@dailyuse/utils';
import type {
  ModuleStatisticsServerDTO,
  ScheduleStatisticsClientDTO,
  ScheduleStatisticsPersistenceDTO,
  ScheduleStatisticsServer,
  ScheduleStatisticsServerDTO,
} from '@dailyuse/contracts/schedule';
import {
  ExecutionStatus,
  ScheduleStatisticsEventTypes,
  ScheduleTaskStatus,
  SourceModule,
} from '@dailyuse/contracts/schedule';

/**
 * ScheduleStatistics 聚合根
 *
 * 职责:
 * - 账户级别的调度统计管理
 * - 任务统计 (总数/活跃/暂停/完成/失败)
 * - 执行统计 (总数/成功/失败/超时/跳过)
 * - 模块级别统计 (reminder/task/goal/notification)
 * - 响应调度事件，实时更新统计
 *
 * TODO: 修复接口实现签名不匹配的问题
 * @domain-server/schedule
 */
export class ScheduleStatistics extends AggregateRoot implements ScheduleStatisticsServer {
  // ============ 私有字段 ============
  private _accountUuid: string;

  // 任务统计
  private _totalTasks: number;
  private _activeTasks: number;
  private _pausedTasks: number;
  private _completedTasks: number;
  private _cancelledTasks: number; // 添加取消任务统计
  private _failedTasks: number;

  // 执行统计
  private _totalExecutions: number;
  private _successfulExecutions: number;
  private _failedExecutions: number;
  private _timeoutExecutions: number;
  private _skippedExecutions: number;

  // 性能统计
  private _avgExecutionDuration: number;
  private _minExecutionDuration: number;
  private _maxExecutionDuration: number;
  private _totalDuration: number; // 用于计算平均值

  // 模块级别统计 - Reminder
  private _reminderTotalTasks: number;
  private _reminderActiveTasks: number;
  private _reminderExecutions: number;
  private _reminderSuccessfulExecutions: number;
  private _reminderFailedExecutions: number;
  private _reminderTotalDuration: number; // 添加总时长统计

  // 模块级别统计 - Task
  private _taskTotalTasks: number;
  private _taskActiveTasks: number;
  private _taskExecutions: number;
  private _taskSuccessfulExecutions: number;
  private _taskFailedExecutions: number;
  private _taskTotalDuration: number;

  // 模块级别统计 - Goal
  private _goalTotalTasks: number;
  private _goalActiveTasks: number;
  private _goalExecutions: number;
  private _goalSuccessfulExecutions: number;
  private _goalFailedExecutions: number;
  private _goalTotalDuration: number;

  // 模块级别统计 - Notification
  private _notificationTotalTasks: number;
  private _notificationActiveTasks: number;
  private _notificationExecutions: number;
  private _notificationSuccessfulExecutions: number;
  private _notificationFailedExecutions: number;
  private _notificationTotalDuration: number;

  // 时间戳
  private _lastUpdatedAt: Date;
  private _createdAt: Date;

  // ============ 私有构造函数 ============
  private constructor(params: {
    accountUuid: string;
    totalTasks: number;
    activeTasks: number;
    pausedTasks: number;
    completedTasks: number;
    cancelledTasks?: number;
    failedTasks: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    timeoutExecutions: number;
    skippedExecutions: number;
    avgExecutionDuration?: number;
    minExecutionDuration?: number;
    maxExecutionDuration?: number;
    totalDuration?: number;
    reminderTotalTasks: number;
    reminderActiveTasks: number;
    reminderExecutions: number;
    reminderSuccessfulExecutions: number;
    reminderFailedExecutions: number;
    reminderTotalDuration?: number;
    taskTotalTasks: number;
    taskActiveTasks: number;
    taskExecutions: number;
    taskSuccessfulExecutions: number;
    taskFailedExecutions: number;
    taskTotalDuration?: number;
    goalTotalTasks: number;
    goalActiveTasks: number;
    goalExecutions: number;
    goalSuccessfulExecutions: number;
    goalFailedExecutions: number;
    goalTotalDuration?: number;
    notificationTotalTasks: number;
    notificationActiveTasks: number;
    notificationExecutions: number;
    notificationSuccessfulExecutions: number;
    notificationFailedExecutions: number;
    notificationTotalDuration?: number;
    lastUpdatedAt: number;
    createdAt: number;
  }) {
    // ScheduleStatistics 使用 accountUuid 作为唯一标识
    super(params.accountUuid);

    this._accountUuid = params.accountUuid;
    this._totalTasks = params.totalTasks;
    this._activeTasks = params.activeTasks;
    this._pausedTasks = params.pausedTasks;
    this._completedTasks = params.completedTasks;
    this._cancelledTasks = params.cancelledTasks ?? 0;
    this._failedTasks = params.failedTasks;
    this._totalExecutions = params.totalExecutions;
    this._successfulExecutions = params.successfulExecutions;
    this._failedExecutions = params.failedExecutions;
    this._timeoutExecutions = params.timeoutExecutions;
    this._skippedExecutions = params.skippedExecutions;

    this._avgExecutionDuration = params.avgExecutionDuration ?? 0;
    this._minExecutionDuration = params.minExecutionDuration ?? 0;
    this._maxExecutionDuration = params.maxExecutionDuration ?? 0;
    this._totalDuration = params.totalDuration ?? 0;

    this._reminderTotalTasks = params.reminderTotalTasks;
    this._reminderActiveTasks = params.reminderActiveTasks;
    this._reminderExecutions = params.reminderExecutions;
    this._reminderSuccessfulExecutions = params.reminderSuccessfulExecutions;
    this._reminderFailedExecutions = params.reminderFailedExecutions;
    this._reminderTotalDuration = params.reminderTotalDuration ?? 0;

    this._taskTotalTasks = params.taskTotalTasks;
    this._taskActiveTasks = params.taskActiveTasks;
    this._taskExecutions = params.taskExecutions;
    this._taskSuccessfulExecutions = params.taskSuccessfulExecutions;
    this._taskFailedExecutions = params.taskFailedExecutions;
    this._taskTotalDuration = params.taskTotalDuration ?? 0;

    this._goalTotalTasks = params.goalTotalTasks;
    this._goalActiveTasks = params.goalActiveTasks;
    this._goalExecutions = params.goalExecutions;
    this._goalSuccessfulExecutions = params.goalSuccessfulExecutions;
    this._goalFailedExecutions = params.goalFailedExecutions;
    this._goalTotalDuration = params.goalTotalDuration ?? 0;

    this._notificationTotalTasks = params.notificationTotalTasks;
    this._notificationActiveTasks = params.notificationActiveTasks;
    this._notificationExecutions = params.notificationExecutions;
    this._notificationSuccessfulExecutions = params.notificationSuccessfulExecutions;
    this._notificationFailedExecutions = params.notificationFailedExecutions;
    this._notificationTotalDuration = params.notificationTotalDuration ?? 0;

    this._lastUpdatedAt = params.lastUpdatedAt;
    this._createdAt = params.createdAt;
  }

  // ============ 公共 Getters ============
  public get id(): number {
    // ScheduleStatistics 使用 accountUuid 作为唯一标识，没有自增 id
    // 返回 0 表示无 id（兼容接口）
    return 0;
  }

  public get accountUuid(): string {
    return this._accountUuid;
  }

  public get totalTasks(): number {
    return this._totalTasks;
  }

  public get activeTasks(): number {
    return this._activeTasks;
  }

  public get pausedTasks(): number {
    return this._pausedTasks;
  }

  public get completedTasks(): number {
    return this._completedTasks;
  }

  public get cancelledTasks(): number {
    return this._cancelledTasks;
  }

  public get failedTasks(): number {
    return this._failedTasks;
  }

  public get totalExecutions(): number {
    return this._totalExecutions;
  }

  public get successfulExecutions(): number {
    return this._successfulExecutions;
  }

  public get failedExecutions(): number {
    return this._failedExecutions;
  }

  public get timeoutExecutions(): number {
    return this._timeoutExecutions;
  }

  public get skippedExecutions(): number {
    return this._skippedExecutions;
  }

  public get avgExecutionDuration(): number {
    return this._avgExecutionDuration;
  }

  public get minExecutionDuration(): number {
    return this._minExecutionDuration;
  }

  public get maxExecutionDuration(): number {
    return this._maxExecutionDuration;
  }

  public get moduleStatistics(): Record<string, ModuleStatisticsServerDTO> {
    return {
      reminder: this.getModuleStats(SourceModule.REMINDER)!,
      task: this.getModuleStats(SourceModule.TASK)!,
      goal: this.getModuleStats(SourceModule.GOAL)!,
      notification: this.getModuleStats(SourceModule.NOTIFICATION)!,
    };
  }

  public get lastUpdatedAt(): Date {
    return this._lastUpdatedAt;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  // ============ 任务统计方法 ============

  /**
   * 增加任务数 (按状态统计)
   * 接口签名: incrementTaskCount(status: ScheduleTaskStatus): void
   */
  public incrementTaskCount(status: ScheduleTaskStatus): void {
    this._totalTasks++;

    switch (status) {
      case 'active':
        this._activeTasks++;
        break;
      case 'paused':
        this._pausedTasks++;
        break;
      case 'completed':
        this._completedTasks++;
        break;
      case 'cancelled':
        this._cancelledTasks++;
        break;
      case 'failed':
        this._failedTasks++;
        break;
    }

    this._lastUpdatedAt = new Date();

    // 发布事件
    this.addDomainEvent({
      eventType: ScheduleStatisticsEventTypes.TASK_COUNT_INCREMENTED,
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        status,
        totalTasks: this._totalTasks,
        activeTasks: this._activeTasks,
      },
    });
  }

  /**
   * 减少任务数 (按状态统计)
   * 接口签名: decrementTaskCount(status: ScheduleTaskStatus): void
   */
  public decrementTaskCount(status: ScheduleTaskStatus): void {
    this._totalTasks = Math.max(0, this._totalTasks - 1);

    switch (status) {
      case 'active':
        this._activeTasks = Math.max(0, this._activeTasks - 1);
        break;
      case 'paused':
        this._pausedTasks = Math.max(0, this._pausedTasks - 1);
        break;
      case 'completed':
        this._completedTasks = Math.max(0, this._completedTasks - 1);
        break;
      case 'cancelled':
        this._cancelledTasks = Math.max(0, this._cancelledTasks - 1);
        break;
      case 'failed':
        this._failedTasks = Math.max(0, this._failedTasks - 1);
        break;
    }

    this._lastUpdatedAt = new Date();

    // 发布事件
    this.addDomainEvent({
      eventType: ScheduleStatisticsEventTypes.TASK_COUNT_DECREMENTED,
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        status,
        totalTasks: this._totalTasks,
        activeTasks: this._activeTasks,
      },
    });
  }

  /**
   * 更新任务状态 (从一个状态变更到另一个状态)
   * 接口签名: updateTaskStatus(oldStatus: ScheduleTaskStatus, newStatus: ScheduleTaskStatus): void
   */
  public updateTaskStatus(oldStatus: ScheduleTaskStatus, newStatus: ScheduleTaskStatus): void {
    // 减少旧状态计数
    switch (oldStatus) {
      case 'active':
        this._activeTasks = Math.max(0, this._activeTasks - 1);
        break;
      case 'paused':
        this._pausedTasks = Math.max(0, this._pausedTasks - 1);
        break;
      case 'completed':
        this._completedTasks = Math.max(0, this._completedTasks - 1);
        break;
      case 'cancelled':
        this._cancelledTasks = Math.max(0, this._cancelledTasks - 1);
        break;
      case 'failed':
        this._failedTasks = Math.max(0, this._failedTasks - 1);
        break;
    }

    // 增加新状态计数
    switch (newStatus) {
      case 'active':
        this._activeTasks++;
        break;
      case 'paused':
        this._pausedTasks++;
        break;
      case 'completed':
        this._completedTasks++;
        break;
      case 'cancelled':
        this._cancelledTasks++;
        break;
      case 'failed':
        this._failedTasks++;
        break;
    }

    this._lastUpdatedAt = new Date();
  }

  /**
   * 暂停任务时更新统计
   */
  public incrementPausedTasks(module: SourceModule): void {
    this._activeTasks = Math.max(0, this._activeTasks - 1);
    this._pausedTasks++;
    this._decrementModuleActiveTaskCount(module);
    this._lastUpdatedAt = new Date();
  }

  /**
   * 恢复任务时更新统计
   */
  public decrementPausedTasks(module: SourceModule): void {
    this._pausedTasks = Math.max(0, this._pausedTasks - 1);
    this._activeTasks++;
    this._incrementModuleActiveTaskCount(module);
    this._lastUpdatedAt = new Date();
  }

  /**
   * 完成任务时更新统计
   */
  public incrementCompletedTasks(module: SourceModule, wasActive: boolean): void {
    if (wasActive) {
      this._activeTasks = Math.max(0, this._activeTasks - 1);
      this._decrementModuleActiveTaskCount(module);
    }
    this._completedTasks++;
    this._lastUpdatedAt = new Date();
  }

  /**
   * 任务失败时更新统计
   */
  public incrementFailedTasks(module: SourceModule, wasActive: boolean): void {
    if (wasActive) {
      this._activeTasks = Math.max(0, this._activeTasks - 1);
      this._decrementModuleActiveTaskCount(module);
    }
    this._failedTasks++;
    this._lastUpdatedAt = new Date();
  }

  // ============ 执行统计方法 ============

  /**
   * 记录执行结果
   * 接口签名: recordExecution(status: ExecutionStatus, duration: number, sourceModule: SourceModule): void
   */
  public recordExecution(
    status: ExecutionStatus,
    duration: number,
    sourceModule: SourceModule,
  ): void {
    this._totalExecutions++;

    // 更新执行状态统计
    switch (status) {
      case 'success':
        this._successfulExecutions++;
        break;
      case 'failed':
        this._failedExecutions++;
        break;
      case 'timeout':
        this._timeoutExecutions++;
        break;
      case 'skipped':
        this._skippedExecutions++;
        break;
    }

    // 更新性能统计
    this._updateExecutionStats(duration);

    // 更新模块执行统计
    this._recordModuleExecution(sourceModule, status, duration);
    this._lastUpdatedAt = new Date();

    // 发布事件
    this.addDomainEvent({
      eventType: ScheduleStatisticsEventTypes.EXECUTION_RECORDED,
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {
        module: sourceModule,
        status,
        duration,
        totalExecutions: this._totalExecutions,
        successfulExecutions: this._successfulExecutions,
        failedExecutions: this._failedExecutions,
      },
    });
  }

  /**
   * 更新执行统计数据 (性能相关)
   * 接口签名: updateExecutionStats(duration: number): void
   */
  public updateExecutionStats(duration: number): void {
    this._updateExecutionStats(duration);
  }

  /**
   * 私有方法：更新执行时长统计
   */
  private _updateExecutionStats(duration: number): void {
    // 更新总时长
    this._totalDuration += duration;

    // 更新平均时长
    this._avgExecutionDuration =
      this._totalExecutions > 0 ? this._totalDuration / this._totalExecutions : 0;

    // 更新最小时长
    if (this._minExecutionDuration === 0 || duration < this._minExecutionDuration) {
      this._minExecutionDuration = duration;
    }

    // 更新最大时长
    if (duration > this._maxExecutionDuration) {
      this._maxExecutionDuration = duration;
    }
  }

  /**
   * 重置所有统计
   * 接口方法: reset(): void
   */
  public reset(): void {
    this.resetAllStats();
  }

  /**
   * 重置所有统计 (内部方法)
   */
  public resetAllStats(): void {
    this._totalTasks = 0;
    this._activeTasks = 0;
    this._pausedTasks = 0;
    this._completedTasks = 0;
    this._failedTasks = 0;
    this._totalExecutions = 0;
    this._successfulExecutions = 0;
    this._failedExecutions = 0;
    this._timeoutExecutions = 0;
    this._skippedExecutions = 0;

    this._reminderTotalTasks = 0;
    this._reminderActiveTasks = 0;
    this._reminderExecutions = 0;
    this._reminderSuccessfulExecutions = 0;
    this._reminderFailedExecutions = 0;

    this._taskTotalTasks = 0;
    this._taskActiveTasks = 0;
    this._taskExecutions = 0;
    this._taskSuccessfulExecutions = 0;
    this._taskFailedExecutions = 0;

    this._goalTotalTasks = 0;
    this._goalActiveTasks = 0;
    this._goalExecutions = 0;
    this._goalSuccessfulExecutions = 0;
    this._goalFailedExecutions = 0;

    this._notificationTotalTasks = 0;
    this._notificationActiveTasks = 0;
    this._notificationExecutions = 0;
    this._notificationSuccessfulExecutions = 0;
    this._notificationFailedExecutions = 0;

    this._lastUpdatedAt = new Date();

    // 发布事件
    this.addDomainEvent({
      eventType: ScheduleStatisticsEventTypes.RESET,
      aggregateId: this._accountUuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: {},
    });
  }

  // ============ 模块级别统计查询 ============

  /**
   * 获取模块统计
   * 接口签名: getModuleStats(moduleName: SourceModule): ModuleStatisticsServerDTO | null
   */
  public getModuleStats(moduleName: SourceModule): ModuleStatisticsServerDTO | null {
    let totalTasks = 0;
    let activeTasks = 0;
    let totalExecutions = 0;
    let successfulExecutions = 0;
    let failedExecutions = 0;
    let totalDuration = 0;

    switch (moduleName) {
      case 'reminder':
        totalTasks = this._reminderTotalTasks;
        activeTasks = this._reminderActiveTasks;
        totalExecutions = this._reminderExecutions;
        successfulExecutions = this._reminderSuccessfulExecutions;
        failedExecutions = this._reminderFailedExecutions;
        totalDuration = this._reminderTotalDuration;
        break;
      case 'task':
        totalTasks = this._taskTotalTasks;
        activeTasks = this._taskActiveTasks;
        totalExecutions = this._taskExecutions;
        successfulExecutions = this._taskSuccessfulExecutions;
        failedExecutions = this._taskFailedExecutions;
        totalDuration = this._taskTotalDuration;
        break;
      case 'goal':
        totalTasks = this._goalTotalTasks;
        activeTasks = this._goalActiveTasks;
        totalExecutions = this._goalExecutions;
        successfulExecutions = this._goalSuccessfulExecutions;
        failedExecutions = this._goalFailedExecutions;
        totalDuration = this._goalTotalDuration;
        break;
      case 'notification':
        totalTasks = this._notificationTotalTasks;
        activeTasks = this._notificationActiveTasks;
        totalExecutions = this._notificationExecutions;
        successfulExecutions = this._notificationSuccessfulExecutions;
        failedExecutions = this._notificationFailedExecutions;
        totalDuration = this._notificationTotalDuration;
        break;
      default:
        return null;
    }

    const avgDuration = totalExecutions > 0 ? totalDuration / totalExecutions : 0;

    return {
      moduleName,
      totalTasks,
      activeTasks,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      avgDuration,
    };
  }

  /**
   * 获取所有模块统计
   * 接口方法: getAllModuleStats(): ModuleStatisticsServerDTO[]
   */
  public getAllModuleStats(): ModuleStatisticsServerDTO[] {
    return [
      this.getModuleStats(SourceModule.REMINDER),
      this.getModuleStats(SourceModule.TASK),
      this.getModuleStats(SourceModule.GOAL),
      this.getModuleStats(SourceModule.NOTIFICATION),
    ].filter((stat): stat is ModuleStatisticsServerDTO => stat !== null);
  }

  /**
   * 更新模块统计
   * 接口方法: updateModuleStats(...)
   */
  public updateModuleStats(
    moduleName: SourceModule,
    tasksDelta: number,
    activeTasksDelta: number,
    executionsDelta: number,
    successDelta: number,
    failureDelta: number,
    durationMs: number,
  ): void {
    switch (moduleName) {
      case SourceModule.REMINDER:
        this._reminderTotalTasks += tasksDelta;
        this._reminderActiveTasks += activeTasksDelta;
        this._reminderExecutions += executionsDelta;
        this._reminderSuccessfulExecutions += successDelta;
        this._reminderFailedExecutions += failureDelta;
        this._reminderTotalDuration += durationMs;
        break;
      case SourceModule.TASK:
        this._taskTotalTasks += tasksDelta;
        this._taskActiveTasks += activeTasksDelta;
        this._taskExecutions += executionsDelta;
        this._taskSuccessfulExecutions += successDelta;
        this._taskFailedExecutions += failureDelta;
        this._taskTotalDuration += durationMs;
        break;
      case SourceModule.GOAL:
        this._goalTotalTasks += tasksDelta;
        this._goalActiveTasks += activeTasksDelta;
        this._goalExecutions += executionsDelta;
        this._goalSuccessfulExecutions += successDelta;
        this._goalFailedExecutions += failureDelta;
        this._goalTotalDuration += durationMs;
        break;
      case SourceModule.NOTIFICATION:
        this._notificationTotalTasks += tasksDelta;
        this._notificationActiveTasks += activeTasksDelta;
        this._notificationExecutions += executionsDelta;
        this._notificationSuccessfulExecutions += successDelta;
        this._notificationFailedExecutions += failureDelta;
        this._notificationTotalDuration += durationMs;
        break;
    }
    this._lastUpdatedAt = new Date();
  }

  /**
   * 计算成功率
   * 接口方法: calculateSuccessRate(): number
   */
  public calculateSuccessRate(): number {
    if (this._totalExecutions === 0) return 0;
    return (this._successfulExecutions / this._totalExecutions) * 100;
  }

  /**
   * 计算失败率
   * 接口方法: calculateFailureRate(): number
   */
  public calculateFailureRate(): number {
    if (this._totalExecutions === 0) return 0;
    return (this._failedExecutions / this._totalExecutions) * 100;
  }

  /**
   * 计算平均时长
   * 接口方法: calculateAverageDuration(): number
   */
  public calculateAverageDuration(): number {
    return this._avgExecutionDuration;
  }

  /**
   * 重置模块统计
   * 接口方法: resetModuleStats(moduleName: SourceModule): void
   */
  public resetModuleStats(moduleName: SourceModule): void {
    switch (moduleName) {
      case SourceModule.REMINDER:
        this._reminderTotalTasks = 0;
        this._reminderActiveTasks = 0;
        this._reminderExecutions = 0;
        this._reminderSuccessfulExecutions = 0;
        this._reminderFailedExecutions = 0;
        this._reminderTotalDuration = 0;
        break;
      case SourceModule.TASK:
        this._taskTotalTasks = 0;
        this._taskActiveTasks = 0;
        this._taskExecutions = 0;
        this._taskSuccessfulExecutions = 0;
        this._taskFailedExecutions = 0;
        this._taskTotalDuration = 0;
        break;
      case SourceModule.GOAL:
        this._goalTotalTasks = 0;
        this._goalActiveTasks = 0;
        this._goalExecutions = 0;
        this._goalSuccessfulExecutions = 0;
        this._goalFailedExecutions = 0;
        this._goalTotalDuration = 0;
        break;
      case SourceModule.NOTIFICATION:
        this._notificationTotalTasks = 0;
        this._notificationActiveTasks = 0;
        this._notificationExecutions = 0;
        this._notificationSuccessfulExecutions = 0;
        this._notificationFailedExecutions = 0;
        this._notificationTotalDuration = 0;
        break;
    }
    this._lastUpdatedAt = new Date();
  }

  // ============ 私有辅助方法 ============

  private _incrementModuleTaskCount(module: SourceModule): void {
    switch (module) {
      case 'reminder':
        this._reminderTotalTasks++;
        this._reminderActiveTasks++;
        break;
      case 'task':
        this._taskTotalTasks++;
        this._taskActiveTasks++;
        break;
      case 'goal':
        this._goalTotalTasks++;
        this._goalActiveTasks++;
        break;
      case 'notification':
        this._notificationTotalTasks++;
        this._notificationActiveTasks++;
        break;
    }
  }

  private _decrementModuleTaskCount(module: SourceModule, wasActive: boolean): void {
    switch (module) {
      case 'reminder':
        this._reminderTotalTasks = Math.max(0, this._reminderTotalTasks - 1);
        if (wasActive) {
          this._reminderActiveTasks = Math.max(0, this._reminderActiveTasks - 1);
        }
        break;
      case 'task':
        this._taskTotalTasks = Math.max(0, this._taskTotalTasks - 1);
        if (wasActive) {
          this._taskActiveTasks = Math.max(0, this._taskActiveTasks - 1);
        }
        break;
      case 'goal':
        this._goalTotalTasks = Math.max(0, this._goalTotalTasks - 1);
        if (wasActive) {
          this._goalActiveTasks = Math.max(0, this._goalActiveTasks - 1);
        }
        break;
      case 'notification':
        this._notificationTotalTasks = Math.max(0, this._notificationTotalTasks - 1);
        if (wasActive) {
          this._notificationActiveTasks = Math.max(0, this._notificationActiveTasks - 1);
        }
        break;
    }
  }

  private _incrementModuleActiveTaskCount(module: SourceModule): void {
    switch (module) {
      case 'reminder':
        this._reminderActiveTasks++;
        break;
      case 'task':
        this._taskActiveTasks++;
        break;
      case 'goal':
        this._goalActiveTasks++;
        break;
      case 'notification':
        this._notificationActiveTasks++;
        break;
    }
  }

  private _decrementModuleActiveTaskCount(module: SourceModule): void {
    switch (module) {
      case 'reminder':
        this._reminderActiveTasks = Math.max(0, this._reminderActiveTasks - 1);
        break;
      case 'task':
        this._taskActiveTasks = Math.max(0, this._taskActiveTasks - 1);
        break;
      case 'goal':
        this._goalActiveTasks = Math.max(0, this._goalActiveTasks - 1);
        break;
      case 'notification':
        this._notificationActiveTasks = Math.max(0, this._notificationActiveTasks - 1);
        break;
    }
  }

  private _recordModuleExecution(
    module: SourceModule,
    status: ExecutionStatus,
    duration: number,
  ): void {
    switch (module) {
      case 'reminder':
        this._reminderExecutions++;
        this._reminderTotalDuration += duration;
        if (status === 'success') this._reminderSuccessfulExecutions++;
        if (status === 'failed') this._reminderFailedExecutions++;
        break;
      case 'task':
        this._taskExecutions++;
        this._taskTotalDuration += duration;
        if (status === 'success') this._taskSuccessfulExecutions++;
        if (status === 'failed') this._taskFailedExecutions++;
        break;
      case 'goal':
        this._goalExecutions++;
        this._goalTotalDuration += duration;
        if (status === 'success') this._goalSuccessfulExecutions++;
        if (status === 'failed') this._goalFailedExecutions++;
        break;
      case 'notification':
        this._notificationExecutions++;
        this._notificationTotalDuration += duration;
        if (status === 'success') this._notificationSuccessfulExecutions++;
        if (status === 'failed') this._notificationFailedExecutions++;
        break;
    }
  }

  // ============ DTO 转换 ============

  /**
   * 转换为 DTO (用于跨层传输)
   */
  public toDTO(): ScheduleStatisticsServerDTO {
    // TODO: 完善实现 - 添加性能统计字段的实际计算逻辑
    return {
      accountUuid: this._accountUuid,
      totalTasks: this._totalTasks,
      activeTasks: this._activeTasks,
      pausedTasks: this._pausedTasks,
      completedTasks: this._completedTasks,
      cancelledTasks: 0, // TODO: 添加 cancelledTasks 字段到私有属性
      failedTasks: this._failedTasks,
      totalExecutions: this._totalExecutions,
      successfulExecutions: this._successfulExecutions,
      failedExecutions: this._failedExecutions,
      skippedExecutions: this._skippedExecutions,
      timeoutExecutions: this._timeoutExecutions,
      avgExecutionDuration: 0, // TODO: 添加执行时长追踪
      minExecutionDuration: 0, // TODO: 添加执行时长追踪
      maxExecutionDuration: 0, // TODO: 添加执行时长追踪
      moduleStatistics: {
        reminder: {
          moduleName: 'reminder',
          totalTasks: this._reminderTotalTasks,
          activeTasks: this._reminderActiveTasks,
          totalExecutions: this._reminderExecutions,
          successfulExecutions: this._reminderSuccessfulExecutions,
          failedExecutions: this._reminderFailedExecutions,
          avgDuration: 0, // TODO: 添加模块级别的执行时长追踪
        },
        task: {
          moduleName: 'task',
          totalTasks: this._taskTotalTasks,
          activeTasks: this._taskActiveTasks,
          totalExecutions: this._taskExecutions,
          successfulExecutions: this._taskSuccessfulExecutions,
          failedExecutions: this._taskFailedExecutions,
          avgDuration: 0,
        },
        goal: {
          moduleName: 'goal',
          totalTasks: this._goalTotalTasks,
          activeTasks: this._goalActiveTasks,
          totalExecutions: this._goalExecutions,
          successfulExecutions: this._goalSuccessfulExecutions,
          failedExecutions: this._goalFailedExecutions,
          avgDuration: 0,
        },
        notification: {
          moduleName: 'notification',
          totalTasks: this._notificationTotalTasks,
          activeTasks: this._notificationActiveTasks,
          totalExecutions: this._notificationExecutions,
          successfulExecutions: this._notificationSuccessfulExecutions,
          failedExecutions: this._notificationFailedExecutions,
          avgDuration: 0,
        },
      },
      lastUpdatedAt: this._lastUpdatedAt,
      createdAt: this._createdAt,
    };
  }

  /**
   * 转换为 Server DTO (用于 API 响应)
   */
  public toServerDTO(): ScheduleStatisticsServerDTO {
    // ServerDTO 和 DTO 结构相同
    return this.toDTO();
  }

  /**
   * 转换为 Client DTO (用于客户端)
   */
  public toClientDTO(): ScheduleStatisticsClientDTO {
    // ClientDTO 和 DTO 结构相同
    return this.toDTO() as unknown as ScheduleStatisticsClientDTO;
  }

  /**
   * 转换为持久化 DTO (用于数据库存储)
   */
  public toPersistenceDTO(): ScheduleStatisticsPersistenceDTO {
    // 将模块统计转换为 JSON string
    const moduleStatsObject = {
      reminder: {
        module_name: 'reminder',
        totalTasks: this._reminderTotalTasks,
        activeTasks: this._reminderActiveTasks,
        totalExecutions: this._reminderExecutions,
        successfulExecutions: this._reminderSuccessfulExecutions,
        failedExecutions: this._reminderFailedExecutions,
        avg_duration: 0,
      },
      task: {
        module_name: 'task',
        totalTasks: this._taskTotalTasks,
        activeTasks: this._taskActiveTasks,
        totalExecutions: this._taskExecutions,
        successfulExecutions: this._taskSuccessfulExecutions,
        failedExecutions: this._taskFailedExecutions,
        avg_duration: 0,
      },
      goal: {
        module_name: 'goal',
        totalTasks: this._goalTotalTasks,
        activeTasks: this._goalActiveTasks,
        totalExecutions: this._goalExecutions,
        successfulExecutions: this._goalSuccessfulExecutions,
        failedExecutions: this._goalFailedExecutions,
        avg_duration: 0,
      },
      notification: {
        module_name: 'notification',
        totalTasks: this._notificationTotalTasks,
        activeTasks: this._notificationActiveTasks,
        totalExecutions: this._notificationExecutions,
        successfulExecutions: this._notificationSuccessfulExecutions,
        failedExecutions: this._notificationFailedExecutions,
        avg_duration: 0,
      },
    };

    return {
      accountUuid: this._accountUuid,
      totalTasks: this._totalTasks,
      activeTasks: this._activeTasks,
      pausedTasks: this._pausedTasks,
      completedTasks: this._completedTasks,
      cancelledTasks: 0, // TODO: 添加字段
      failedTasks: this._failedTasks,
      totalExecutions: this._totalExecutions,
      successfulExecutions: this._successfulExecutions,
      failedExecutions: this._failedExecutions,
      skippedExecutions: this._skippedExecutions,
      timeoutExecutions: this._timeoutExecutions,
      avgExecutionDuration: 0, // TODO: 添加执行时长追踪
      minExecutionDuration: 0,
      maxExecutionDuration: 0,
      moduleStatistics: JSON.stringify(moduleStatsObject),
      lastUpdatedAt: this._lastUpdatedAt.getTime(),
      createdAt: this._createdAt.getTime(),
    };
  }

  // ============ 静态工厂方法 ============

  /**
   * 创建新的统计实例 (新账户)
   */
  public static createEmpty(accountUuid: string): ScheduleStatistics {
    const now = Date.now();

    const statistics = new ScheduleStatistics({
      accountUuid,
      totalTasks: 0,
      activeTasks: 0,
      pausedTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      timeoutExecutions: 0,
      skippedExecutions: 0,
      reminderTotalTasks: 0,
      reminderActiveTasks: 0,
      reminderExecutions: 0,
      reminderSuccessfulExecutions: 0,
      reminderFailedExecutions: 0,
      taskTotalTasks: 0,
      taskActiveTasks: 0,
      taskExecutions: 0,
      taskSuccessfulExecutions: 0,
      taskFailedExecutions: 0,
      goalTotalTasks: 0,
      goalActiveTasks: 0,
      goalExecutions: 0,
      goalSuccessfulExecutions: 0,
      goalFailedExecutions: 0,
      notificationTotalTasks: 0,
      notificationActiveTasks: 0,
      notificationExecutions: 0,
      notificationSuccessfulExecutions: 0,
      notificationFailedExecutions: 0,
      lastUpdatedAt: now,
      createdAt: now,
    });

    // 发布创建事件
    statistics.addDomainEvent({
      eventType: ScheduleStatisticsEventTypes.CREATED,
      aggregateId: accountUuid,
      occurredOn: new Date(),
      accountUuid,
      payload: {},
    });

    return statistics;
  }

  /**
   * 从 ServerDTO 创建 (用于跨层重建)
   * TODO: 完善实现以支持从 ServerDTO 重建聚合根
   */
  public static fromDTO(dto: ScheduleStatisticsServerDTO): ScheduleStatistics {
    // 从 moduleStatistics Record 提取模块级别数据
    const reminderStats = dto.moduleStatistics.reminder ?? {
      moduleName: 'reminder',
      totalTasks: 0,
      activeTasks: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgDuration: 0,
    };
    const taskStats = dto.moduleStatistics.task ?? {
      moduleName: 'task',
      totalTasks: 0,
      activeTasks: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgDuration: 0,
    };
    const goalStats = dto.moduleStatistics.goal ?? {
      moduleName: 'goal',
      totalTasks: 0,
      activeTasks: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgDuration: 0,
    };
    const notificationStats = dto.moduleStatistics.notification ?? {
      moduleName: 'notification',
      totalTasks: 0,
      activeTasks: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      avgDuration: 0,
    };

    return new ScheduleStatistics({
      accountUuid: dto.accountUuid,
      totalTasks: dto.totalTasks,
      activeTasks: dto.activeTasks,
      pausedTasks: dto.pausedTasks,
      completedTasks: dto.completedTasks,
      failedTasks: dto.failedTasks,
      totalExecutions: dto.totalExecutions,
      successfulExecutions: dto.successfulExecutions,
      failedExecutions: dto.failedExecutions,
      timeoutExecutions: dto.timeoutExecutions,
      skippedExecutions: dto.skippedExecutions,
      reminderTotalTasks: reminderStats.totalTasks,
      reminderActiveTasks: reminderStats.activeTasks,
      reminderExecutions: reminderStats.totalExecutions,
      reminderSuccessfulExecutions: reminderStats.successfulExecutions,
      reminderFailedExecutions: reminderStats.failedExecutions,
      taskTotalTasks: taskStats.totalTasks,
      taskActiveTasks: taskStats.activeTasks,
      taskExecutions: taskStats.totalExecutions,
      taskSuccessfulExecutions: taskStats.successfulExecutions,
      taskFailedExecutions: taskStats.failedExecutions,
      goalTotalTasks: goalStats.totalTasks,
      goalActiveTasks: goalStats.activeTasks,
      goalExecutions: goalStats.totalExecutions,
      goalSuccessfulExecutions: goalStats.successfulExecutions,
      goalFailedExecutions: goalStats.failedExecutions,
      notificationTotalTasks: notificationStats.totalTasks,
      notificationActiveTasks: notificationStats.activeTasks,
      notificationExecutions: notificationStats.totalExecutions,
      notificationSuccessfulExecutions: notificationStats.successfulExecutions,
      notificationFailedExecutions: notificationStats.failedExecutions,
      lastUpdatedAt: dto.lastUpdatedAt,
      createdAt: new Date(dto.createdAt),
    });
  }

  /**
   * 从持久化 DTO 创建 (用于数据库加载)
   * TODO: 完善实现以支持从 PersistenceDTO 重建聚合根
   */
  public static fromPersistenceDTO(dto: ScheduleStatisticsPersistenceDTO): ScheduleStatistics {
    // 从 moduleStatistics JSON string 解析模块级别数据
    const moduleStatsObject = JSON.parse(dto.moduleStatistics) as Record<
      string,
      {
        module_name: string;
        totalTasks: number;
        activeTasks: number;
        totalExecutions: number;
        successfulExecutions: number;
        failedExecutions: number;
        avg_duration: number;
      }
    >;

    const reminderStats = moduleStatsObject.reminder ?? {
      totalTasks: 0,
      activeTasks: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
    };
    const taskStats = moduleStatsObject.task ?? {
      totalTasks: 0,
      activeTasks: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
    };
    const goalStats = moduleStatsObject.goal ?? {
      totalTasks: 0,
      activeTasks: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
    };
    const notificationStats = moduleStatsObject.notification ?? {
      totalTasks: 0,
      activeTasks: 0,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
    };

    return new ScheduleStatistics({
      accountUuid: dto.accountUuid,
      totalTasks: dto.totalTasks,
      activeTasks: dto.activeTasks,
      pausedTasks: dto.pausedTasks,
      completedTasks: dto.completedTasks,
      failedTasks: dto.failedTasks,
      totalExecutions: dto.totalExecutions,
      successfulExecutions: dto.successfulExecutions,
      failedExecutions: dto.failedExecutions,
      timeoutExecutions: dto.timeoutExecutions,
      skippedExecutions: dto.skippedExecutions,
      reminderTotalTasks: reminderStats.totalTasks,
      reminderActiveTasks: reminderStats.activeTasks,
      reminderExecutions: reminderStats.totalExecutions,
      reminderSuccessfulExecutions: reminderStats.successfulExecutions,
      reminderFailedExecutions: reminderStats.failedExecutions,
      taskTotalTasks: taskStats.totalTasks,
      taskActiveTasks: taskStats.activeTasks,
      taskExecutions: taskStats.totalExecutions,
      taskSuccessfulExecutions: taskStats.successfulExecutions,
      taskFailedExecutions: taskStats.failedExecutions,
      goalTotalTasks: goalStats.totalTasks,
      goalActiveTasks: goalStats.activeTasks,
      goalExecutions: goalStats.totalExecutions,
      goalSuccessfulExecutions: goalStats.successfulExecutions,
      goalFailedExecutions: goalStats.failedExecutions,
      notificationTotalTasks: notificationStats.totalTasks,
      notificationActiveTasks: notificationStats.activeTasks,
      notificationExecutions: notificationStats.totalExecutions,
      notificationSuccessfulExecutions: notificationStats.successfulExecutions,
      notificationFailedExecutions: notificationStats.failedExecutions,
      lastUpdatedAt: dto.lastUpdatedAt,
      createdAt: new Date(dto.createdAt),
    });
  }
}
