/**
 * ReminderStatistics 聚合根实现
 * 实现 ReminderStatisticsServer 接口
 */

import type {
  GroupStatsInfo,
  ReminderStatisticsClientDTO,
  ReminderStatisticsPersistenceDTO,
  ReminderStatisticsServer,
  ReminderStatisticsServerDTO,
  TemplateStatsInfo,
  TriggerStatsInfo,
} from '@dailyuse/contracts/reminder';
import { AggregateRoot } from '@dailyuse/utils';

export class ReminderStatistics extends AggregateRoot implements ReminderStatisticsServer {
  private _accountUuid: string;
  private _templateStats: TemplateStatsInfo;
  private _groupStats: GroupStatsInfo;
  private _triggerStats: TriggerStatsInfo;
  private _calculatedAt: number;

  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    templateStats: TemplateStatsInfo;
    groupStats: GroupStatsInfo;
    triggerStats: TriggerStatsInfo;
    calculatedAt: number;
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._templateStats = params.templateStats;
    this._groupStats = params.groupStats;
    this._triggerStats = params.triggerStats;
    this._calculatedAt = params.calculatedAt;
  }

  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get templateStats(): TemplateStatsInfo {
    return { ...this._templateStats };
  }
  public get groupStats(): GroupStatsInfo {
    return { ...this._groupStats };
  }
  public get triggerStats(): TriggerStatsInfo {
    return { ...this._triggerStats };
  }
  public get calculatedAt(): number {
    return this._calculatedAt;
  }

  public static create(params: { accountUuid: string }): ReminderStatistics {
    const uuid = params.accountUuid;
    const now = Date.now();
    return new ReminderStatistics({
      uuid,
      accountUuid: params.accountUuid,
      templateStats: {
        totalTemplates: 0,
        activeTemplates: 0,
        pausedTemplates: 0,
        oneTimeTemplates: 0,
        recurringTemplates: 0,
      },
      groupStats: {
        totalGroups: 0,
        activeGroups: 0,
        pausedGroups: 0,
        groupControlledGroups: 0,
        individualControlledGroups: 0,
      },
      triggerStats: {
        todayTriggers: 0,
        weekTriggers: 0,
        monthTriggers: 0,
        totalTriggers: 0,
        successfulTriggers: 0,
        failedTriggers: 0,
      },
      calculatedAt: now,
    });
  }

  public static fromServerDTO(dto: ReminderStatisticsServerDTO): ReminderStatistics {
    return new ReminderStatistics({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      templateStats: dto.templateStats,
      groupStats: dto.groupStats,
      triggerStats: dto.triggerStats,
      calculatedAt: dto.calculatedAt,
    });
  }

  public static fromPersistenceDTO(dto: ReminderStatisticsPersistenceDTO): ReminderStatistics {
    return new ReminderStatistics({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      templateStats: JSON.parse(dto.templateStats),
      groupStats: JSON.parse(dto.groupStats),
      triggerStats: JSON.parse(dto.triggerStats),
      calculatedAt: dto.calculatedAt,
    });
  }

  // ===== 业务方法 =====

  /**
   * 重新计算统计信息（完整计算）
   * 接收 templates 和 groups 数组，重新计算所有统计
   */
  public recalculate(templates: any[], groups: any[]): void {
    this._templateStats = this.calculateTemplateStats(templates);
    this._groupStats = this.calculateGroupStats(groups);
    // triggerStats 需要从历史记录计算，这里保持不变
    this._calculatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'ReminderStatisticsUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: { statistics: this.toServerDTO() },
    });
  }

  /**
   * 更新模板统计信息（部分更新）
   */
  public updateTemplateStats(templateStats: Partial<TemplateStatsInfo>): void {
    this._templateStats = {
      ...this._templateStats,
      ...templateStats,
    };
    this._calculatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'ReminderStatisticsUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: { statistics: this.toServerDTO() },
    });
  }

  /**
   * 更新分组统计信息（部分更新）
   */
  public updateGroupStats(groupStats: Partial<GroupStatsInfo>): void {
    this._groupStats = {
      ...this._groupStats,
      ...groupStats,
    };
    this._calculatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'ReminderStatisticsUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: { statistics: this.toServerDTO() },
    });
  }

  /**
   * 更新触发统计信息（部分更新）
   */
  public updateTriggerStats(triggerStats: Partial<TriggerStatsInfo>): void {
    this._triggerStats = {
      ...this._triggerStats,
      ...triggerStats,
    };
    this._calculatedAt = Date.now();

    this.addDomainEvent({
      eventType: 'ReminderStatisticsUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: { statistics: this.toServerDTO() },
    });
  }

  /**
   * 获取今日触发成功率
   */
  public getTodaySuccessRate(): number {
    if (this._triggerStats.todayTriggers === 0) return 0;
    const successToday = this._triggerStats.successfulTriggers;
    return (successToday / this._triggerStats.todayTriggers) * 100;
  }

  /**
   * 获取本周触发成功率
   */
  public getWeekSuccessRate(): number {
    if (this._triggerStats.weekTriggers === 0) return 0;
    const successWeek = this._triggerStats.successfulTriggers;
    return (successWeek / this._triggerStats.weekTriggers) * 100;
  }

  /**
   * 获取触发趋势
   */
  public getTriggerTrend(): 'UP' | 'DOWN' | 'STABLE' {
    const todayRate = this.getTodaySuccessRate();
    const weekRate = this.getWeekSuccessRate();

    if (todayRate > weekRate + 5) return 'UP';
    if (todayRate < weekRate - 5) return 'DOWN';
    return 'STABLE';
  }

  /**
   * 获取指定时间范围内的触发次数
   * 注意：这个方法需要访问历史记录，实际实现应该在应用服务层
   */
  public async getTriggersInRange(startDate: number, endDate: number): Promise<number> {
    // 这里返回估算值，实际应该在 ApplicationService 中查询历史记录
    return 0;
  }

  /**
   * 旧版本的 calculate 方法（保持向后兼容）
   * @deprecated 使用 recalculate() 替代
   */
  public async calculate(): Promise<void> {
    this._calculatedAt = Date.now();
    this.addDomainEvent({
      eventType: 'ReminderStatisticsUpdated',
      aggregateId: this.uuid,
      occurredOn: new Date(),
      accountUuid: this._accountUuid,
      payload: { statistics: this.toServerDTO() },
    });
  }

  // ===== 私有计算方法 =====

  /**
   * 计算模板统计
   */
  private calculateTemplateStats(templates: any[]): TemplateStatsInfo {
    const active = templates.filter((t) => t.status === 'ACTIVE').length;
    const paused = templates.filter((t) => t.status === 'PAUSED').length;
    const oneTime = templates.filter((t) => t.reminderType === 'ONE_TIME').length;
    const recurring = templates.filter((t) => t.reminderType === 'RECURRING').length;

    return {
      totalTemplates: templates.length,
      activeTemplates: active,
      pausedTemplates: paused,
      oneTimeTemplates: oneTime,
      recurringTemplates: recurring,
    };
  }

  /**
   * 计算分组统计
   */
  private calculateGroupStats(groups: any[]): GroupStatsInfo {
    const active = groups.filter((g) => g.status === 'ACTIVE').length;
    const paused = groups.filter((g) => g.status === 'PAUSED').length;
    const groupControlled = groups.filter((g) => g.controlMode === 'GROUP_CONTROLLED').length;
    const individualControlled = groups.filter(
      (g) => g.controlMode === 'INDIVIDUAL_CONTROLLED',
    ).length;

    return {
      totalGroups: groups.length,
      activeGroups: active,
      pausedGroups: paused,
      groupControlledGroups: groupControlled,
      individualControlledGroups: individualControlled,
    };
  }

  public toServerDTO(): ReminderStatisticsServerDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      templateStats: this.templateStats,
      groupStats: this.groupStats,
      triggerStats: this.triggerStats,
      calculatedAt: this.calculatedAt,
    };
  }

  public toClientDTO(): ReminderStatisticsClientDTO {
    const successRate =
      this.triggerStats.totalTriggers > 0
        ? (this.triggerStats.successfulTriggers / this.triggerStats.totalTriggers) * 100
        : 0;

    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      templateStats: this.templateStats,
      groupStats: this.groupStats,
      triggerStats: this.triggerStats,
      calculatedAt: this.calculatedAt,

      // UI 扩展
      todayTriggersText: `今日 ${this.triggerStats.todayTriggers} 次`,
      weekTriggersText: `本周 ${this.triggerStats.weekTriggers} 次`,
      successRateText: `成功率 ${successRate.toFixed(1)}%`,
    };
  }

  public toPersistenceDTO(): ReminderStatisticsPersistenceDTO {
    return {
      uuid: this.uuid,
      accountUuid: this.accountUuid,
      templateStats: JSON.stringify(this.templateStats),
      groupStats: JSON.stringify(this.groupStats),
      triggerStats: JSON.stringify(this.triggerStats),
      calculatedAt: this.calculatedAt,
    };
  }
}
