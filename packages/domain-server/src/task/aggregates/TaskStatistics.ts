/**
 * TaskStatistics 聚合根实现 (Server)
 * 任务统计 - 聚合根
 */

import type {
  CompletionStatsInfo,
  DistributionStatsInfo,
  InstanceStatsInfo,
  TaskStatisticsClientDTO,
  TaskStatisticsPersistenceDTO,
  TaskStatisticsServer,
  TaskStatisticsServerDTO,
  TemplateStatsInfo,
  TimeStatsInfo,
} from '@dailyuse/contracts/task';
import { AggregateRoot } from '@dailyuse/utils';

/**
 * TaskStatistics 构造函数参数
 */
interface TaskStatisticsProps {
  accountUuid: string;
  templateStats: TemplateStatsInfo;
  instanceStats: InstanceStatsInfo;
  completionStats: CompletionStatsInfo;
  timeStats: TimeStatsInfo;
  distributionStats: DistributionStatsInfo;
  calculatedAt: number;
}

/**
 * TaskStatistics 聚合根
 *
 * DDD 聚合根职责：
 * - 管理任务统计信息
 * - 提供统计计算方法
 * - 是事务边界
 */
export class TaskStatistics extends AggregateRoot implements TaskStatisticsServer {
  // ===== 私有字段 =====
  private _accountUuid: string;
  private _templateStats: TemplateStatsInfo;
  private _instanceStats: InstanceStatsInfo;
  private _completionStats: CompletionStatsInfo;
  private _timeStats: TimeStatsInfo;
  private _distributionStats: DistributionStatsInfo;
  private _calculatedAt: Date;

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(props: TaskStatisticsProps, uuid?: string) {
    super(uuid || AggregateRoot.generateUUID());
    this._accountUuid = props.accountUuid;
    this._templateStats = props.templateStats;
    this._instanceStats = props.instanceStats;
    this._completionStats = props.completionStats;
    this._timeStats = props.timeStats;
    this._distributionStats = props.distributionStats;
    this._calculatedAt = props.calculatedAt;
  }

  // ===== Getter 属性 =====
  public override get uuid(): string {
    return this._uuid;
  }

  public get accountUuid(): string {
    return this._accountUuid;
  }

  public get templateStats(): TemplateStatsInfo {
    return { ...this._templateStats };
  }

  public get instanceStats(): InstanceStatsInfo {
    return { ...this._instanceStats };
  }

  public get completionStats(): CompletionStatsInfo {
    return { ...this._completionStats };
  }

  public get timeStats(): TimeStatsInfo {
    return { ...this._timeStats };
  }

  public get distributionStats(): DistributionStatsInfo {
    return {
      tasksByImportance: { ...this._distributionStats.tasksByImportance },
      tasksByUrgency: { ...this._distributionStats.tasksByUrgency },
      tasksByFolder: { ...this._distributionStats.tasksByFolder },
      tasksByTag: { ...this._distributionStats.tasksByTag },
    };
  }

  public get calculatedAt(): Date {
    return this._calculatedAt;
  }

  // ===== 静态工厂方法 =====

  /**
   * 创建默认的统计信息（用于新账户）
   */
  public static createDefault(accountUuid: string): TaskStatistics {
    const now = Date.now();

    const statistics = new TaskStatistics(
      {
        accountUuid,
        templateStats: {
          totalTemplates: 0,
          activeTemplates: 0,
          pausedTemplates: 0,
          archivedTemplates: 0,
          oneTimeTemplates: 0,
          recurringTemplates: 0,
        },
        instanceStats: {
          totalInstances: 0,
          todayInstances: 0,
          weekInstances: 0,
          monthInstances: 0,
          pendingInstances: 0,
          inProgressInstances: 0,
          completedInstances: 0,
          skippedInstances: 0,
          expiredInstances: 0,
        },
        completionStats: {
          todayCompleted: 0,
          weekCompleted: 0,
          monthCompleted: 0,
          totalCompleted: 0,
          averageCompletionTime: null,
          completionRate: 0,
        },
        timeStats: {
          allDayTasks: 0,
          timePointTasks: 0,
          timeRangeTasks: 0,
          overdueInstances: 0,
          upcomingInstances: 0,
        },
        distributionStats: {
          tasksByImportance: {},
          tasksByUrgency: {},
          tasksByFolder: {},
          tasksByTag: {},
        },
        calculatedAt: now,
      },
      AggregateRoot.generateUUID(),
    );

    // 发布领域事件
    statistics.addDomainEvent({
      eventType: 'task.statistics.created',
      aggregateId: statistics.uuid,
      occurredOn: new Date(now),
      payload: {
        accountUuid,
        statistics: statistics.toServerDTO(),
      },
    });

    return statistics;
  }

  /**
   * 从 ServerDTO 创建实体
   */
  public static fromServerDTO(dto: TaskStatisticsServerDTO): TaskStatistics {
    return new TaskStatistics(
      {
        accountUuid: dto.accountUuid,
        templateStats: dto.templateStats,
        instanceStats: dto.instanceStats,
        completionStats: dto.completionStats,
        timeStats: dto.timeStats,
        distributionStats: dto.distributionStats,
        calculatedAt: dto.calculatedAt,
      },
      dto.uuid,
    );
  }

  /**
   * 从 PersistenceDTO 恢复实体
   */
  public static fromPersistenceDTO(dto: TaskStatisticsPersistenceDTO): TaskStatistics {
    return new TaskStatistics(
      {
        accountUuid: dto.accountUuid,
        templateStats: {
          totalTemplates: dto.templateTotal,
          activeTemplates: dto.templateActive,
          pausedTemplates: dto.templatePaused,
          archivedTemplates: dto.templateArchived,
          oneTimeTemplates: dto.templateOneTime,
          recurringTemplates: dto.templateRecurring,
        },
        instanceStats: {
          totalInstances: dto.instanceTotal,
          todayInstances: dto.instanceToday,
          weekInstances: dto.instanceWeek,
          monthInstances: dto.instanceMonth,
          pendingInstances: dto.instancePending,
          inProgressInstances: dto.instanceInProgress,
          completedInstances: dto.instanceCompleted,
          skippedInstances: dto.instanceSkipped,
          expiredInstances: dto.instanceExpired,
        },
        completionStats: {
          todayCompleted: dto.completionToday,
          weekCompleted: dto.completionWeek,
          monthCompleted: dto.completionMonth,
          totalCompleted: dto.completionTotal,
          averageCompletionTime: dto.completionAvgTime ?? null,
          completionRate: dto.completionRate,
        },
        timeStats: {
          allDayTasks: dto.timeAllDay,
          timePointTasks: dto.timePoint,
          timeRangeTasks: dto.timeRange,
          overdueInstances: dto.timeOverdue,
          upcomingInstances: dto.timeUpcoming,
        },
        distributionStats: {
          tasksByImportance: JSON.parse(dto.distributionByImportance),
          tasksByUrgency: JSON.parse(dto.distributionByUrgency),
          tasksByFolder: JSON.parse(dto.distributionByFolder),
          tasksByTag: JSON.parse(dto.distributionByTag),
        },
        calculatedAt: dto.calculatedAt,
      },
      dto.uuid,
    );
  }

  // ===== 业务方法 =====

  /**
   * 重新计算统计信息
   * 基于传入的模板和实例数据重新计算所有统计
   */
  public recalculate(templates: any[], instances: any[]): void {
    const previousStats = this.toServerDTO();
    const now = Date.now();

    // 计算模板统计
    this._templateStats = this.calculateTemplateStats(templates);

    // 计算实例统计
    this._instanceStats = this.calculateInstanceStats(instances);

    // 计算完成统计
    this._completionStats = this.calculateCompletionStats(instances);

    // 计算时间统计
    this._timeStats = this.calculateTimeStats(templates, instances);

    // 计算分布统计
    this._distributionStats = this.calculateDistributionStats(templates);

    this._calculatedAt = now;

    // 发布领域事件
    this.addDomainEvent({
      eventType: 'task.statistics.recalculated',
      aggregateId: this.uuid,
      occurredOn: new Date(now),
      payload: {
        statistics: this.toServerDTO(),
        previousStatistics: previousStats,
        reason: 'Manual recalculation',
      },
    });
  }

  /**
   * 更新模板统计
   */
  public updateTemplateStats(templateStats: Partial<TemplateStatsInfo>): void {
    this._templateStats = {
      ...this._templateStats,
      ...templateStats,
    };
    this._calculatedAt = new Date();

    this.addDomainEvent({
      eventType: 'task.statistics.updated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        statistics: this.toServerDTO(),
        updatedField: 'templateStats',
      },
    });
  }

  /**
   * 更新实例统计
   */
  public updateInstanceStats(instanceStats: Partial<InstanceStatsInfo>): void {
    this._instanceStats = {
      ...this._instanceStats,
      ...instanceStats,
    };
    this._calculatedAt = new Date();

    this.addDomainEvent({
      eventType: 'task.statistics.updated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        statistics: this.toServerDTO(),
        updatedField: 'instanceStats',
      },
    });
  }

  /**
   * 更新完成统计
   */
  public updateCompletionStats(completionStats: Partial<CompletionStatsInfo>): void {
    this._completionStats = {
      ...this._completionStats,
      ...completionStats,
    };
    this._calculatedAt = new Date();

    this.addDomainEvent({
      eventType: 'task.statistics.updated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      payload: {
        statistics: this.toServerDTO(),
        updatedField: 'completionStats',
      },
    });
  }

  /**
   * 获取今日完成率
   */
  public getTodayCompletionRate(): number {
    const todayTotal = this._instanceStats.todayInstances;
    if (todayTotal === 0) return 0;

    const todayCompleted = this._completionStats.todayCompleted;
    return Math.round((todayCompleted / todayTotal) * 100);
  }

  /**
   * 获取本周完成率
   */
  public getWeekCompletionRate(): number {
    const weekTotal = this._instanceStats.weekInstances;
    if (weekTotal === 0) return 0;

    const weekCompleted = this._completionStats.weekCompleted;
    return Math.round((weekCompleted / weekTotal) * 100);
  }

  /**
   * 获取效率趋势
   * 对比今日完成率和本周平均完成率
   */
  public getEfficiencyTrend(): 'UP' | 'DOWN' | 'STABLE' {
    const todayRate = this.getTodayCompletionRate();
    const weekRate = this.getWeekCompletionRate();

    const diff = todayRate - weekRate;

    if (diff > 5) return 'UP';
    if (diff < -5) return 'DOWN';
    return 'STABLE';
  }

  // ===== 私有辅助方法 =====

  /**
   * 计算模板统计
   */
  private calculateTemplateStats(templates: any[]): TemplateStatsInfo {
    const stats: TemplateStatsInfo = {
      totalTemplates: templates.length,
      activeTemplates: 0,
      pausedTemplates: 0,
      archivedTemplates: 0,
      oneTimeTemplates: 0,
      recurringTemplates: 0,
    };

    for (const template of templates) {
      // 按状态统计
      if (template.status === 'ACTIVE') stats.activeTemplates++;
      else if (template.status === 'PAUSED') stats.pausedTemplates++;
      else if (template.status === 'ARCHIVED') stats.archivedTemplates++;

      // 按类型统计
      if (template.taskType === 'ONE_TIME') stats.oneTimeTemplates++;
      else if (template.taskType === 'RECURRING') stats.recurringTemplates++;
    }

    return stats;
  }

  /**
   * 计算实例统计
   */
  private calculateInstanceStats(instances: any[]): InstanceStatsInfo {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;
    const monthStart = now - 30 * 24 * 60 * 60 * 1000;

    const stats: InstanceStatsInfo = {
      totalInstances: instances.length,
      todayInstances: 0,
      weekInstances: 0,
      monthInstances: 0,
      pendingInstances: 0,
      inProgressInstances: 0,
      completedInstances: 0,
      skippedInstances: 0,
      expiredInstances: 0,
    };

    for (const instance of instances) {
      // 按时间范围统计
      if (instance.scheduledStartTime >= todayStart) stats.todayInstances++;
      if (instance.scheduledStartTime >= weekStart) stats.weekInstances++;
      if (instance.scheduledStartTime >= monthStart) stats.monthInstances++;

      // 按状态统计
      if (instance.status === 'PENDING') stats.pendingInstances++;
      else if (instance.status === 'IN_PROGRESS') stats.inProgressInstances++;
      else if (instance.status === 'COMPLETED') stats.completedInstances++;
      else if (instance.status === 'SKIPPED') stats.skippedInstances++;
      else if (instance.status === 'EXPIRED') stats.expiredInstances++;
    }

    return stats;
  }

  /**
   * 计算完成统计
   */
  private calculateCompletionStats(instances: any[]): CompletionStatsInfo {
    const now = Date.now();
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const weekStart = now - 7 * 24 * 60 * 60 * 1000;
    const monthStart = now - 30 * 24 * 60 * 60 * 1000;

    const completedInstances = instances.filter((i) => i.status === 'COMPLETED');

    const stats: CompletionStatsInfo = {
      todayCompleted: completedInstances.filter((i) => i.completedAt >= todayStart).length,
      weekCompleted: completedInstances.filter((i) => i.completedAt >= weekStart).length,
      monthCompleted: completedInstances.filter((i) => i.completedAt >= monthStart).length,
      totalCompleted: completedInstances.length,
      averageCompletionTime: null,
      completionRate: 0,
    };

    // 计算平均完成时间
    const durations = completedInstances
      .filter((i) => i.actualDuration != null)
      .map((i) => i.actualDuration);

    if (durations.length > 0) {
      stats.averageCompletionTime = durations.reduce((a, b) => a + b, 0) / durations.length;
    }

    // 计算完成率
    if (instances.length > 0) {
      stats.completionRate = Math.round((completedInstances.length / instances.length) * 100);
    }

    return stats;
  }

  /**
   * 计算时间统计
   */
  private calculateTimeStats(templates: any[], instances: any[]): TimeStatsInfo {
    const now = Date.now();

    const stats: TimeStatsInfo = {
      allDayTasks: templates.filter((t) => t.timeConfig?.timeType === 'ALL_DAY').length,
      timePointTasks: templates.filter((t) => t.timeConfig?.timeType === 'TIME_POINT').length,
      timeRangeTasks: templates.filter((t) => t.timeConfig?.timeType === 'TIME_RANGE').length,
      overdueInstances: instances.filter((i) => i.status === 'PENDING' && i.scheduledEndTime < now)
        .length,
      upcomingInstances: instances.filter(
        (i) =>
          i.status === 'PENDING' &&
          i.scheduledStartTime > now &&
          i.scheduledStartTime < now + 24 * 60 * 60 * 1000,
      ).length,
    };

    return stats;
  }

  /**
   * 计算分布统计
   */
  private calculateDistributionStats(templates: any[]): DistributionStatsInfo {
    const stats: DistributionStatsInfo = {
      tasksByImportance: {},
      tasksByUrgency: {},
      tasksByFolder: {},
      tasksByTag: {},
    };

    for (const template of templates) {
      // 按重要性统计
      const importance = template.importance || 'UNKNOWN';
      stats.tasksByImportance[importance] = (stats.tasksByImportance[importance] || 0) + 1;

      // 按紧急度统计
      const urgency = template.urgency || 'UNKNOWN';
      stats.tasksByUrgency[urgency] = (stats.tasksByUrgency[urgency] || 0) + 1;

      // 按文件夹统计
      const folder = template.folderUuid || 'NONE';
      stats.tasksByFolder[folder] = (stats.tasksByFolder[folder] || 0) + 1;

      // 按标签统计
      if (template.tags && Array.isArray(template.tags)) {
        for (const tag of template.tags) {
          stats.tasksByTag[tag] = (stats.tasksByTag[tag] || 0) + 1;
        }
      }
    }

    return stats;
  }

  // ===== 转换方法 =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(): TaskStatisticsServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      templateStats: this._templateStats,
      instanceStats: this._instanceStats,
      completionStats: this._completionStats,
      timeStats: this._timeStats,
      distributionStats: this._distributionStats,
      calculatedAt: this._calculatedAt.getTime(),
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(): TaskStatisticsClientDTO {
    const todayCompleted = this._completionStats.todayCompleted;
    const todayTotal = this._instanceStats.todayInstances;
    const weekCompleted = this._completionStats.weekCompleted;
    const weekTotal = this._instanceStats.weekInstances;
    const completionRate = this._completionStats.completionRate;
    const overdueCount = this._timeStats.overdueInstances;

    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      templateStats: this._templateStats,
      instanceStats: this._instanceStats,
      completionStats: this._completionStats,
      timeStats: this._timeStats,
      distributionStats: this._distributionStats,
      calculatedAt: this._calculatedAt.getTime(),
      // UI 扩展字段
      todayCompletionText: `今日完成 ${todayCompleted}/${todayTotal}`,
      weekCompletionText: `本周完成 ${weekCompleted}/${weekTotal}`,
      completionRateText: `完成率 ${Math.round(completionRate)}%`,
      overdueText: overdueCount > 0 ? `${overdueCount} 个逾期` : '无逾期',
      efficiencyTrendText: this.getEfficiencyTrendText(),
    };
  }

  /**
   * 获取效率趋势文本
   */
  private getEfficiencyTrendText(): string {
    const todayRate = this._instanceStats.todayInstances > 0
      ? this._completionStats.todayCompleted / this._instanceStats.todayInstances
      : 0;
    const weekRate = this._instanceStats.weekInstances > 0
      ? this._completionStats.weekCompleted / this._instanceStats.weekInstances
      : 0;

    if (todayRate > weekRate * 1.1) {
      return '效率提升';
    } else if (todayRate < weekRate * 0.9) {
      return '效率下降';
    }
    return '保持稳定';
  }

  /**
   * 转换为 Persistence DTO (数据库)
   */
  public toPersistenceDTO(): TaskStatisticsPersistenceDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,

      // Template stats (扁平化)
      templateTotal: this._templateStats.totalTemplates,
      templateActive: this._templateStats.activeTemplates,
      templatePaused: this._templateStats.pausedTemplates,
      templateArchived: this._templateStats.archivedTemplates,
      templateOneTime: this._templateStats.oneTimeTemplates,
      templateRecurring: this._templateStats.recurringTemplates,

      // Instance stats (扁平化)
      instanceTotal: this._instanceStats.totalInstances,
      instanceToday: this._instanceStats.todayInstances,
      instanceWeek: this._instanceStats.weekInstances,
      instanceMonth: this._instanceStats.monthInstances,
      instancePending: this._instanceStats.pendingInstances,
      instanceInProgress: this._instanceStats.inProgressInstances,
      instanceCompleted: this._instanceStats.completedInstances,
      instanceSkipped: this._instanceStats.skippedInstances,
      instanceExpired: this._instanceStats.expiredInstances,

      // Completion stats (扁平化)
      completionToday: this._completionStats.todayCompleted,
      completionWeek: this._completionStats.weekCompleted,
      completionMonth: this._completionStats.monthCompleted,
      completionTotal: this._completionStats.totalCompleted,
      completionAvgTime: this._completionStats.averageCompletionTime,
      completionRate: this._completionStats.completionRate,

      // Time stats (扁平化)
      timeAllDay: this._timeStats.allDayTasks,
      timePoint: this._timeStats.timePointTasks,
      timeRange: this._timeStats.timeRangeTasks,
      timeOverdue: this._timeStats.overdueInstances,
      timeUpcoming: this._timeStats.upcomingInstances,

      // Distribution stats (JSON)
      distributionByImportance: JSON.stringify(this._distributionStats.tasksByImportance),
      distributionByUrgency: JSON.stringify(this._distributionStats.tasksByUrgency),
      distributionByFolder: JSON.stringify(this._distributionStats.tasksByFolder),
      distributionByTag: JSON.stringify(this._distributionStats.tasksByTag),

      calculatedAt: this._calculatedAt.getTime(),
    };
  }
}
