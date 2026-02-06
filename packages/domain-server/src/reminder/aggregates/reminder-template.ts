/**
 * ReminderTemplate 聚合根实现
 * 实现 ReminderTemplateServer 接口
 */

import type {
  ActiveHoursConfigServer,
  ActiveHoursConfigServerDTO,
  ActiveTimeConfigServer,
  ActiveTimeConfigServerDTO,
  FrequencyAdjustmentDTO,
  NotificationConfigServer,
  NotificationConfigServerDTO,
  RecurrenceConfigServer,
  RecurrenceConfigServerDTO,
  ReminderStatsServer,
  ReminderTemplateClientDTO,
  ReminderTemplatePersistenceDTO,
  ReminderTemplateServer,
  ReminderTemplateServerDTO,
  ResponseMetricsDTO,
  TriggerConfigServer,
  TriggerConfigServerDTO,
} from '@dailyuse/contracts/reminder';
import {
  NotificationChannel,
  ReminderStatus,
  ReminderType,
  TriggerResult,
} from '@dailyuse/contracts/reminder';
import { ImportanceLevel } from '@dailyuse/contracts/shared';

import { ReminderTemplateId } from '@dailyuse/domain-shared/reminder';
import { IdentityId } from '@dailyuse/domain-shared';
import { AggregateRoot, generateUUID } from '@dailyuse/utils';
import {
  RecurrenceConfig,
  NotificationConfig,
  TriggerConfig,
  ActiveTimeConfig,
  ActiveHoursConfig,
  ReminderStats,
  ResponseMetrics,
  FrequencyAdjustment,
} from '../value-objects';
import { ReminderHistory } from '../entities';

/**
 * ReminderTemplate 内部状态接口
 */
interface ReminderTemplateState {
  identityId: IdentityId;
  title: string;
  description: string | null;
  type: ReminderType;
  trigger: TriggerConfig;
  recurrence: RecurrenceConfig | null;
  activeTime: ActiveTimeConfig;
  activeHours: ActiveHoursConfig | null;
  notificationConfig: NotificationConfig;
  selfEnabled: boolean;
  status: ReminderStatus;
  groupUuid: string | null;
  effectiveEnabled: boolean;
  importanceLevel: ImportanceLevel;
  tags: string[];
  color: string | null;
  icon: string | null;
  nextTriggerAt: number | null;
  stats: ReminderStats;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: number | null;
  version: number;
  // 智能频率相关字段 (Story 5-2)
  responseMetrics: ResponseMetrics | null;
  frequencyAdjustment: FrequencyAdjustment | null;
  smartFrequencyEnabled: boolean;
  // 子实体集合
  history: ReminderHistory[];
}

/**
 * ReminderTemplate 聚合根
 *
 * DDD 聚合根职责：
 * - 管理聚合内的所有实体（ReminderHistory）
 * - 执行业务逻辑
 * - 确保聚合内的一致性
 * - 是事务边界
 */
export class ReminderTemplate extends AggregateRoot<ReminderTemplateId> implements ReminderTemplateServer {
  // ===== 私有字段 =====
  private _props: ReminderTemplateState;

  // ===== 构造函数（私有，通过工厂方法创建） =====
  private constructor(params: {
    uuid?: string;
    identityId: IdentityId;
    title: string;
    description?: string | null;
    type: ReminderType;
    trigger: TriggerConfig;
    recurrence?: RecurrenceConfig | null;
    activeTime: ActiveTimeConfig;
    activeHours?: ActiveHoursConfig | null;
    notificationConfig: NotificationConfig;
    selfEnabled: boolean;
    status: ReminderStatus;
    groupUuid?: string | null;
    importanceLevel: ImportanceLevel;
    tags?: string[];
    color?: string | null;
    icon?: string | null;
    nextTriggerAt?: number | null;
    stats: ReminderStats;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
    version?: number;
    // 智能频率相关 (Story 5-2)
    responseMetrics?: ResponseMetrics | null;
    frequencyAdjustment?: FrequencyAdjustment | null;
    smartFrequencyEnabled?: boolean;
  }) {
    super(params.uuid ? ReminderTemplateId.of(params.uuid) : ReminderTemplateId.generate());
    this._props = {
      identityId: params.identityId,
      title: params.title,
      description: params.description ?? null,
      type: params.type,
      trigger: params.trigger,
      recurrence: params.recurrence ?? null,
      activeTime: params.activeTime,
      activeHours: params.activeHours ?? null,
      notificationConfig: params.notificationConfig,
      selfEnabled: params.selfEnabled,
      status: params.status,
      groupUuid: params.groupUuid ?? null,
      effectiveEnabled: params.selfEnabled, // 初始化时默认等于 selfEnabled
      importanceLevel: params.importanceLevel,
      tags: params.tags ? [...params.tags] : [],
      color: params.color ?? null,
      icon: params.icon ?? null,
      nextTriggerAt: params.nextTriggerAt ?? null,
      stats: params.stats,
      createdAt: new Date(params.createdAt),
      updatedAt: new Date(params.updatedAt),
      deletedAt: params.deletedAt ?? null,
      version: params.version ?? 1,
      // 智能频率相关 (Story 5-2)
      responseMetrics: params.responseMetrics ?? null,
      frequencyAdjustment: params.frequencyAdjustment ?? null,
      smartFrequencyEnabled: params.smartFrequencyEnabled ?? true,
      history: [],
    };
  }

  // ===== Getter 属性 =====
  public get uuid(): string {
    return this.id;
  }
  public get identityId(): IdentityId {
    return this._props.identityId;
  }
  public get title(): string {
    return this._props.title;
  }
  public get description(): string | null {
    return this._props.description;
  }
  public get type(): ReminderType {
    return this._props.type;
  }
  public get trigger(): TriggerConfigServer {
    return this._props.trigger;
  }
  public get recurrence(): RecurrenceConfigServer | null {
    return this._props.recurrence;
  }
  public get activeTime(): ActiveTimeConfigServer {
    return this._props.activeTime;
  }
  public get activeHours(): ActiveHoursConfigServer | null {
    return this._props.activeHours;
  }
  public get notificationConfig(): NotificationConfigServer {
    return this._props.notificationConfig;
  }
  public get selfEnabled(): boolean {
    return this._props.selfEnabled;
  }
  public get status(): ReminderStatus {
    return this._props.status;
  }
  public get groupUuid(): string | null {
    return this._props.groupUuid;
  }
  public get importanceLevel(): ImportanceLevel {
    return this._props.importanceLevel;
  }
  public get tags(): string[] {
    return [...this._props.tags];
  }
  public get color(): string | null {
    return this._props.color;
  }
  public get icon(): string | null {
    return this._props.icon;
  }
  public get nextTriggerAt(): number | null {
    return this._props.nextTriggerAt;
  }
  public get stats(): ReminderStatsServer {
    return this._props.stats;
  }
  public get createdAt(): Date {
    return this._props.createdAt;
  }
  public get updatedAt(): Date {
    return this._props.updatedAt;
  }
  public get deletedAt(): Date | null {
    return this._props.deletedAt !== null ? new Date(this._props.deletedAt) : null;
  }

  public get version(): number {
    return this._props.version;
  }

  public get effectiveEnabled(): boolean {
    return this._props.effectiveEnabled;
  }

  // ===== 智能频率相关 Getter (Story 5-2) =====
  public get responseMetrics(): ResponseMetrics | null {
    return this._props.responseMetrics;
  }

  public get frequencyAdjustment(): FrequencyAdjustment | null {
    return this._props.frequencyAdjustment;
  }

  public get smartFrequencyEnabled(): boolean {
    return this._props.smartFrequencyEnabled;
  }

  public get history(): ReminderHistory[] | null {
    return this._props.history.length > 0 ? [...this._props.history] : null;
  }

  // ===== 工厂方法 =====

  /**
   * 创建新的 ReminderTemplate 聚合根
   */
  public static create(params: {
    identityId: IdentityId;
    title: string;
    type: ReminderType;
    trigger: TriggerConfigServerDTO;
    activeTime: ActiveTimeConfigServerDTO;
    notificationConfig: NotificationConfigServerDTO;
    description?: string;
    recurrence?: RecurrenceConfigServerDTO;
    activeHours?: ActiveHoursConfigServerDTO;
    importanceLevel?: ImportanceLevel;
    tags?: string[];
    color?: string;
    icon?: string;
    groupUuid?: string;
  }): ReminderTemplate {
    const uuid = generateUUID();
    const now = Date.now();

    // 创建值对象
    const trigger = TriggerConfig.fromDTO(params.trigger);
    const activeTime = ActiveTimeConfig.fromDTO(params.activeTime);
    const notificationConfig = NotificationConfig.fromDTO(params.notificationConfig);
    const recurrence = params.recurrence ? RecurrenceConfig.fromDTO(params.recurrence) : null;
    const activeHours = params.activeHours
      ? ActiveHoursConfig.fromDTO(params.activeHours)
      : null;

    // 创建空统计
    const stats = ReminderStats.createEmpty();

    const template = new ReminderTemplate({
      uuid,
      identityId: params.identityId,
      title: params.title,
      description: params.description,
      type: params.type,
      trigger,
      recurrence,
      activeTime,
      activeHours,
      notificationConfig,
      selfEnabled: true, // 默认启用
      status: ReminderStatus.Active,
      groupUuid: params.groupUuid,
      importanceLevel: params.importanceLevel ?? (ImportanceLevel.Moderate as ImportanceLevel),
      tags: params.tags,
      color: params.color,
      icon: params.icon,
      stats,
      createdAt: now,
      updatedAt: now,
      version: 1,
    });

    // 计算下次触发时间
    template._props.nextTriggerAt = template.calculateNextTrigger();

    // 发布创建事件
    template.addDomainEvent('reminder.template.created', {
      templateUuid: uuid,
      identityId: params.identityId,
      title: params.title,
      type: params.type,
    });

    return template;
  }

  /**
   * 从 Server DTO 创建实体
   */
  public static fromServerDTO(dto: ReminderTemplateServerDTO): ReminderTemplate {
    const trigger = TriggerConfig.fromDTO(dto.trigger);
    const activeTime = ActiveTimeConfig.fromDTO(dto.activeTime);
    const notificationConfig = NotificationConfig.fromDTO(dto.notificationConfig);
    const recurrence = dto.recurrence ? RecurrenceConfig.fromDTO(dto.recurrence) : null;
    const activeHours = dto.activeHours ? ActiveHoursConfig.fromDTO(dto.activeHours) : null;
    const stats = ReminderStats.fromDTO(dto.stats);

    const template = new ReminderTemplate({
      uuid: dto.id as string,
      identityId: IdentityId.of(dto.identityId),
      title: dto.name,
      description: dto.description,
      type: dto.type,
      trigger,
      recurrence,
      activeTime,
      activeHours,
      notificationConfig,
      selfEnabled: dto.selfEnabled,
      status: dto.status,
      groupUuid: dto.groupUuid,
      importanceLevel: dto.importanceLevel,
      tags: dto.tags,
      color: dto.color,
      icon: dto.icon,
      nextTriggerAt: dto.nextTriggerAt,
      stats,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt ?? null,
      version: (dto as any).version ?? 1,
      // 智能频率相关 - 这些字段不在 ReminderTemplateServerDTO 中，使用默认值
      responseMetrics: null,
      frequencyAdjustment: null,
      smartFrequencyEnabled: true,
    });

    // 加载历史记录
    if (dto.history) {
      template._props.history = dto.history.map((h) => ReminderHistory.fromServerDTO(h));
    }

    return template;
  }

  /**
   * 从 Persistence DTO 创建实体
   */
  public static fromPersistenceDTO(dto: ReminderTemplatePersistenceDTO): ReminderTemplate {
    const trigger = TriggerConfig.fromDTO(JSON.parse(dto.trigger));
    const activeTime = ActiveTimeConfig.fromDTO(JSON.parse(dto.activeTime));
    const notificationConfig = NotificationConfig.fromDTO(JSON.parse(dto.notificationConfig));
    const recurrence = dto.recurrence
      ? RecurrenceConfig.fromDTO(JSON.parse(dto.recurrence))
      : null;
    const activeHours = dto.activeHours
      ? ActiveHoursConfig.fromDTO(JSON.parse(dto.activeHours))
      : null;
    const stats = ReminderStats.fromDTO(JSON.parse(dto.stats));
    const tags = JSON.parse(dto.tags);

    // Smart Frequency: Reconstruct ResponseMetrics from flat fields
    const responseMetrics =
      dto.clickRate !== null &&
      dto.clickRate !== undefined &&
      dto.ignoreRate !== null &&
      dto.ignoreRate !== undefined
        ? ResponseMetrics.fromDTO({
            clickRate: dto.clickRate,
            ignoreRate: dto.ignoreRate,
            avgResponseTime: dto.avgResponseTime ?? 0,
            snoozeCount: dto.snoozeCount ?? 0,
            effectivenessScore: dto.effectivenessScore ?? 0,
            sampleSize: dto.sampleSize ?? 0,
            lastAnalysisTime: dto.lastAnalysisTime?.getTime() ?? Date.now(),
          })
        : null;

    // Smart Frequency: Reconstruct FrequencyAdjustment from flat fields
    const frequencyAdjustment =
      dto.originalInterval !== null &&
      dto.originalInterval !== undefined &&
      dto.adjustedInterval !== null &&
      dto.adjustedInterval !== undefined
        ? FrequencyAdjustment.fromDTO({
            originalInterval: dto.originalInterval,
            adjustedInterval: dto.adjustedInterval,
            adjustmentReason: dto.adjustmentReason ?? '',
            adjustmentTime: dto.adjustmentTime?.getTime() ?? Date.now(),
            isAutoAdjusted: dto.isAutoAdjusted ?? false,
            userConfirmed: dto.userConfirmed ?? false,
            rejectionReason: null,
          })
        : null;

    return new ReminderTemplate({
      uuid: dto.id as string,
      identityId: IdentityId.of(dto.identityId),
      title: dto.name,
      description: dto.description,
      type: dto.type,
      trigger,
      recurrence,
      activeTime,
      activeHours,
      notificationConfig,
      selfEnabled: dto.selfEnabled,
      status: dto.status,
      groupUuid: dto.groupUuid,
      importanceLevel: dto.importanceLevel,
      tags,
      color: dto.color,
      icon: dto.icon,
      nextTriggerAt: dto.nextTriggerAt?.getTime() ?? null,
      stats,

      // Smart Frequency fields
      responseMetrics,
      frequencyAdjustment,
      smartFrequencyEnabled: dto.smartFrequencyEnabled ?? true,

      createdAt: dto.createdAt.getTime(),
      updatedAt: dto.updatedAt.getTime(),
      deletedAt: dto.deletedAt?.getTime() ?? null,
      version: (dto as any).version ?? 1,
    });
  }

  // ===== 子实体管理方法 =====

  /**
   * 创建子实体：ReminderHistory
   */
  public createHistory(params: {
    triggeredAt: number;
    result: TriggerResult;
    error?: string;
  }): ReminderHistory {
    const history = ReminderHistory.create({
      templateUuid: this.uuid,
      triggeredAt: params.triggeredAt,
      result: params.result,
      error: params.error,
      notificationSent: this._props.notificationConfig.channels.length > 0,
      notificationChannels: this._props.notificationConfig.channels,
    });

    this._props.history.push(history);
    return history;
  }

  /**
   * 添加历史记录到聚合根
   */
  public addHistory(history: ReminderHistory): void {
    this._props.history.push(history);
  }

  /**
   * 获取所有历史记录
   */
  public getAllHistory(): ReminderHistory[] {
    return [...this._props.history];
  }

  /**
   * 获取最近 N 条历史记录
   */
  public getRecentHistory(limit: number): ReminderHistory[] {
    return this._props.history.slice(-limit);
  }

  // ===== 业务方法 =====

  /**
   * 更新提醒模板
   */
  public update(updates: {
    title?: string;
    description?: string;
    trigger?: TriggerConfigServerDTO;
    activeTime?: ActiveTimeConfigServerDTO;
    notificationConfig?: NotificationConfigServerDTO;
    recurrence?: RecurrenceConfigServerDTO | null;
    activeHours?: ActiveHoursConfigServerDTO | null;
    importanceLevel?: ImportanceLevel;
    tags?: string[];
    color?: string | null;
    icon?: string | null;
    groupUuid?: string | null;
  }): void {
    const now = Date.now();

    // 更新基础字段
    if (updates.title !== undefined) {
      this._props.title = updates.title;
    }
    if (updates.description !== undefined) {
      this._props.description = updates.description;
    }
    if (updates.importanceLevel !== undefined) {
      this._props.importanceLevel = updates.importanceLevel;
    }
    if (updates.tags !== undefined) {
      this._props.tags = [...updates.tags];
    }
    if (updates.color !== undefined) {
      this._props.color = updates.color;
    }
    if (updates.icon !== undefined) {
      this._props.icon = updates.icon;
    }
    if (updates.groupUuid !== undefined) {
      this._props.groupUuid = updates.groupUuid;
    }

    // 更新值对象
    if (updates.trigger !== undefined) {
      this._props.trigger = TriggerConfig.fromDTO(updates.trigger);
    }
    if (updates.activeTime !== undefined) {
      this._props.activeTime = ActiveTimeConfig.fromDTO(updates.activeTime);
    }
    if (updates.notificationConfig !== undefined) {
      this._props.notificationConfig = NotificationConfig.fromDTO(updates.notificationConfig);
    }
    if (updates.recurrence !== undefined) {
      this._props.recurrence = updates.recurrence
        ? RecurrenceConfig.fromDTO(updates.recurrence)
        : null;
    }
    if (updates.activeHours !== undefined) {
      this._props.activeHours = updates.activeHours
        ? ActiveHoursConfig.fromDTO(updates.activeHours)
        : null;
    }

    // 重新计算下次触发时间
    this._props.nextTriggerAt = this.calculateNextTrigger();
    this._props.updatedAt = new Date(now);

    // 发布更新事件
    this.addDomainEvent('reminder.template.updated', {
      template: this.toServerDTO(),
      updates: Object.keys(updates),
      identityId: this._props.identityId,
    });
  }

  /**
   * 启用模板
   * 重构说明：启用时更新 activatedAt 为当前时间，作为循环提醒的计算基准
   */
  public enable(): void {
    const now = Date.now();
    this._props.selfEnabled = true;
    this._props.status = ReminderStatus.Active;

    // 更新 activatedAt 为当前时间
    this._props.activeTime = this._props.activeTime.with({ activatedAt: now });

    this._props.updatedAt = new Date(now);

    // selfEnabled 变化，需要重新计算 effectiveEnabled
    // 注意：如果有分组且分组控制模式为 GROUP，需要在应用层重新计算
    // 这里先假设启用（应用层会调用 setEffectiveEnabled 来修正）
    this._props.effectiveEnabled = true;

    // 发布启用事件
    this.addDomainEvent('reminder.template.enabled', {
      templateUuid: this.uuid,
      activatedAt: now,
      identityId: this._props.identityId,
    });
  }

  /**
   * 暂停模板
   */
  public pause(): void {
    this._props.selfEnabled = false;
    this._props.status = ReminderStatus.Paused;
    this._props.updatedAt = new Date(Date.now());

    // selfEnabled 变化，需要重新计算 effectiveEnabled
    // 注意：如果有分组且分组控制模式为 GROUP，需要在应用层重新计算
    // 这里先简单设置为 false
    this._props.effectiveEnabled = false;

    // 发布暂停事件
    this.addDomainEvent('reminder.template.paused', {
      templateUuid: this.uuid,
      identityId: this._props.identityId,
    });
  }

  /**
   * 切换状态
   */
  public toggle(): void {
    if (this._props.selfEnabled) {
      this.pause();
    } else {
      this.enable();
    }
  }

  /**
   * 移动到分组（专用方法）
   *
   * @param targetGroupUuid 目标分组 UUID，null 表示移出分组
   */
  public moveToGroup(targetGroupUuid: string | null): void {
    const oldGroupUuid = this._props.groupUuid;

    // 如果分组没有变化，直接返回
    if (oldGroupUuid === targetGroupUuid) {
      return;
    }

    this._props.groupUuid = targetGroupUuid;
    this._props.updatedAt = new Date(Date.now());

    // groupUuid 变化，effectiveEnabled 需要重新计算
    // 应用层需要调用 setEffectiveEnabled 来更新

    // 发布移动事件
    this.addDomainEvent('reminder.template.moved', {
      templateUuid: this.uuid,
      oldGroupUuid,
      newGroupUuid: targetGroupUuid,
      identityId: this._props.identityId,
    });
  }

  /**
   * 设置有效启用状态（由应用层/领域服务调用）
   *
   * 应在以下情况调用：
   * 1. 模板移动到新分组时
   * 2. 模板的 selfEnabled 变化时
   * 3. 分组的控制模式或启用状态变化时
   *
   * @param effectiveEnabled 计算后的有效启用状态
   */
  public setEffectiveEnabled(effectiveEnabled: boolean): void {
    this._props.effectiveEnabled = effectiveEnabled;
  }

  /**
   * 是否实际启用（同步方法，直接返回缓存值）
   */
  public isEffectivelyEnabled(): boolean {
    return this._props.effectiveEnabled;
  }

  /**
   * 计算下次触发时间
   * 重构说明：使用 activatedAt 作为循环提醒的计算基准
   */
  public calculateNextTrigger(): number | null {
    // 这是一个简化版本，实际实现需要根据 trigger 和 recurrence 配置计算
    // 建议在领域服务中实现复杂的计算逻辑
    const now = Date.now();

    // 检查模板状态，只有 ACTIVE 状态才触发
    if (this._props.status !== ReminderStatus.Active) {
      return null;
    }

    // 检查是否已激活（now >= activatedAt）
    if (now < this._props.activeTime.activatedAt) {
      // 尚未到激活时间，下次触发时间就是激活时间
      return this._props.activeTime.activatedAt;
    }

    // 已激活，根据 recurrence 计算下次触发时间
    // 简化版本：返回1小时后（实际应基于 activatedAt + interval）
    return now + 3600000;
  }

  /**
   * 是否应该现在触发
   */
  public shouldTriggerNow(): boolean {
    const now = Date.now();
    return this._props.nextTriggerAt !== null && now >= this._props.nextTriggerAt;
  }

  /**
   * 在指定时间是否应该触发
   */
  public shouldTriggerAt(timestamp: number): boolean {
    return this._props.nextTriggerAt !== null && timestamp >= this._props.nextTriggerAt;
  }

  /**
   * 在指定时间是否活跃
   * 重构说明：只检查 activatedAt 和 status，移除 endDate 检查
   */
  public isActiveAtTime(timestamp: number): boolean {
    // 检查状态
    if (this._props.status !== ReminderStatus.Active) {
      return false;
    }

    // 检查是否已激活
    if (timestamp < this._props.activeTime.activatedAt) {
      return false;
    }

    // 检查活跃时间段
    if (this._props.activeHours && this._props.activeHours.enabled) {
      const date = new Date(timestamp);
      const hour = date.getHours();
      if (hour < this._props.activeHours.startHour || hour > this._props.activeHours.endHour) {
        return false;
      }
    }

    return true;
  }

  /**
   * 记录触发
   */
  public recordTrigger(): void {
    const now = Date.now();

    // 创建历史记录
    this.createHistory({
      triggeredAt: now,
      result: TriggerResult.Success,
    });

    // 更新统计
    this._props.stats = this._props.stats.with({
      totalTriggers: this._props.stats.totalTriggers + 1,
      lastTriggeredAt: now,
    });

    // 计算下次触发时间
    this._props.nextTriggerAt = this.calculateNextTrigger();
    this._props.updatedAt = new Date(now);

    // 发布触发事件
    this.addDomainEvent('reminder.template.triggered', {
      templateUuid: this.uuid,
      triggeredAt: now,
      nextTriggerAt: this._props.nextTriggerAt,
      identityId: this._props.identityId,
    });
  }

  /**
   * 查询方法
   */
  public isActive(): boolean {
    return this._props.status === ReminderStatus.Active;
  }

  public isPaused(): boolean {
    return this._props.status === ReminderStatus.Paused;
  }

  public isOneTime(): boolean {
    return this._props.type === ReminderType.OneTime;
  }

  public isRecurring(): boolean {
    return this._props.type === ReminderType.Recurring;
  }

  public getNextTriggerTime(): number | null {
    return this._props.nextTriggerAt;
  }

  public async getGroup(): Promise<any | null> {
    // 需要在应用层实现
    return null;
  }

  /**
   * 软删除
   */
  public softDelete(): void {
    this._props.deletedAt = Date.now();
    this._props.updatedAt = new Date(Date.now());

    // 发布删除事件
    this.addDomainEvent('reminder.template.deleted', {
      templateUuid: this.uuid,
      templateTitle: this._props.title,
      identityId: this._props.identityId,
    });
  }

  /**
   * 恢复
   */
  public restore(): void {
    this._props.deletedAt = null;
    this._props.updatedAt = new Date(Date.now());
  }

  /**
   * 标签管理
   */
  public addTag(tag: string): void {
    if (!this._props.tags.includes(tag)) {
      this._props.tags.push(tag);
      this._props.updatedAt = new Date(Date.now());
    }
  }

  public removeTag(tag: string): void {
    const index = this._props.tags.indexOf(tag);
    if (index > -1) {
      this._props.tags.splice(index, 1);
      this._props.updatedAt = new Date(Date.now());
    }
  }

  // ===== 智能频率相关方法 (Story 5-2) =====

  /**
   * 更新响应指标
   */
  public updateResponseMetrics(metrics: ResponseMetricsDTO): void {
    this._props.responseMetrics = ResponseMetrics.fromDTO(metrics);
    this._props.updatedAt = new Date(Date.now());
  }

  /**
   * 应用频率调整（自动调整或用户手动调整）
   */
  public applyFrequencyAdjustment(adjustment: FrequencyAdjustmentDTO): void {
    this._props.frequencyAdjustment = FrequencyAdjustment.fromDTO(adjustment);
    // 注意：实际的触发间隔调整应该在 Domain Service 或 Application Service 中处理
    // 这里只记录调整信息
    this._props.updatedAt = new Date(Date.now());
  }

  /**
   * 用户确认频率调整
   */
  public confirmFrequencyAdjustment(): void {
    if (!this._props.frequencyAdjustment) {
      throw new Error('No frequency adjustment to confirm');
    }
    this._props.frequencyAdjustment = this._props.frequencyAdjustment.with({
      userConfirmed: true,
    });
    this._props.updatedAt = new Date(Date.now());
  }

  /**
   * 用户拒绝频率调整
   */
  public rejectFrequencyAdjustment(reason?: string): void {
    if (!this._props.frequencyAdjustment) {
      throw new Error('No frequency adjustment to reject');
    }
    this._props.frequencyAdjustment = this._props.frequencyAdjustment.with({
      rejectionReason: reason ?? '用户拒绝',
    });
    // 注意：实际的触发间隔恢复应该在 Domain Service 或 Application Service 中处理
    this._props.updatedAt = new Date(Date.now());
  }

  /**
   * 启用/禁用智能频率
   */
  public toggleSmartFrequency(enabled: boolean): void {
    this._props.smartFrequencyEnabled = enabled;
    this._props.updatedAt = new Date(Date.now());
  }

  /**
   * 判断是否需要频率调整（基于响应指标）
   */
  public needsFrequencyAdjustment(): boolean {
    if (!this._props.responseMetrics || !this._props.smartFrequencyEnabled) {
      return false;
    }
    // Check if effectiveness is low or ignore rate is high
    return this._props.responseMetrics.effectivenessScore < 40 || this._props.responseMetrics.ignoreRate > 60;
  }

  /**
   * 计算建议的频率调整
   */
  public calculateSuggestedAdjustment(): FrequencyAdjustmentDTO | null {
    if (!this._props.responseMetrics || !this._props.smartFrequencyEnabled || !this._props.trigger) {
      return null;
    }

    // 如果不需要调整，返回 null
    if (!this.needsFrequencyAdjustment()) {
      return null;
    }

    const effectivenessScore = this._props.responseMetrics.effectivenessScore;
    const ignoreRate = this._props.responseMetrics.ignoreRate;

    // 获取当前间隔（秒）
    let currentIntervalSeconds: number;
    if (this._props.trigger.interval) {
      // interval.minutes 转换为秒
      currentIntervalSeconds = this._props.trigger.interval.minutes * 60;
    } else {
      // 默认每天（86400秒）
      currentIntervalSeconds = 86400;
    }

    let adjustedIntervalSeconds: number;
    let reason = '';

    // 频率调整策略
    if (effectivenessScore < 20 && ignoreRate > 80) {
      // 大幅降低频率（×3）
      adjustedIntervalSeconds = currentIntervalSeconds * 3;
      reason = `效果评分过低(${effectivenessScore.toFixed(1)})且忽略率过高(${ignoreRate.toFixed(1)}%)，建议降低频率`;
    } else if (effectivenessScore < 40 && ignoreRate > 60) {
      // 降低频率（×2）
      adjustedIntervalSeconds = currentIntervalSeconds * 2;
      reason = `效果评分较低(${effectivenessScore.toFixed(1)})且忽略率较高(${ignoreRate.toFixed(1)}%)，建议降低频率`;
    } else if (effectivenessScore > 80 && ignoreRate < 20) {
      // 可考虑增加频率（×0.8）
      adjustedIntervalSeconds = Math.round(currentIntervalSeconds * 0.8);
      reason = `效果评分高(${effectivenessScore.toFixed(1)})且忽略率低(${ignoreRate.toFixed(1)}%)，可适当提高频率`;
    } else {
      // 不需要调整
      return null;
    }

    return {
      originalInterval: currentIntervalSeconds,
      adjustedInterval: adjustedIntervalSeconds,
      adjustmentReason: reason,
      adjustmentTime: Date.now(),
      isAutoAdjusted: true,
      userConfirmed: false,
      rejectionReason: null,
    };
  }

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(includeChildren = false): ReminderTemplateServerDTO {
    const dto: ReminderTemplateServerDTO = {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.title,
      description: this._props.description,
      type: this._props.type,
      trigger: this._props.trigger.toServerDTO(),
      recurrence: this._props.recurrence?.toServerDTO() ?? null,
      activeTime: this._props.activeTime.toServerDTO(),
      activeHours: this._props.activeHours?.toServerDTO() ?? null,
      notificationConfig: this._props.notificationConfig.toServerDTO(),
      selfEnabled: this._props.selfEnabled,
      status: this._props.status,
      groupUuid: this._props.groupUuid,
      importanceLevel: this._props.importanceLevel,
      tags: [...this._props.tags],
      color: this._props.color,
      icon: this._props.icon,
      nextTriggerAt: this._props.nextTriggerAt,
      stats: this._props.stats.toServerDTO(),
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt,
      version: this._props.version,
    } as ReminderTemplateServerDTO;

    if (includeChildren && this._props.history.length > 0) {
      dto.history = this._props.history.map((h) => h.toServerDTO());
    }

    return dto;
  }

  public toClientDTO(includeChildren = false): ReminderTemplateClientDTO {
    // Note: effectiveEnabled and controlledByGroup should ideally be passed in
    // from an application service that has the context of the group.
    // Here we default to the template's own state.
    const effectiveEnabled = this._props.selfEnabled;
    const controlledByGroup = !!this._props.groupUuid;

    const typeText = this._props.type === ReminderType.OneTime ? '一次性' : '循环';
    const statusText = this._props.status === ReminderStatus.Active ? '活跃' : '暂停';
    const importanceMap: Record<ImportanceLevel, string> = {
      Vital: '关键',
      Important: '重要',
      Moderate: '中等',
      Minor: '次要',
      Trivial: '琐碎',
    };
    const importanceText = importanceMap[this._props.importanceLevel];

    // 简单的相对时间文本
    const formatRelativeTime = (timestamp: number | null): string | null => {
      if (!timestamp) return null;
      const diff = timestamp - Date.now();
      if (diff < 0) return `${Math.round(-diff / 3600000)} 小时前`;
      return `${Math.round(diff / 3600000)} 小时后`;
    };

    // Build trigger client DTO manually
    const triggerServerDTO = this._props.trigger.toServerDTO();
    const triggerClientDTO = {
      ...triggerServerDTO,
      displayText: this._props.trigger.displayText,
    };

    // Build recurrence client DTO manually
    const recurrenceClientDTO = this._props.recurrence
      ? {
          ...this._props.recurrence.toServerDTO(),
          displayText: (this._props.recurrence as { displayText?: string }).displayText ?? '',
        }
      : null;

    // Build activeTime client DTO manually - format display text
    const activeTimeServerDTO = this._props.activeTime.toServerDTO();
    const activeTimeClientDTO = {
      ...activeTimeServerDTO,
      displayText: new Date(activeTimeServerDTO.activatedAt).toLocaleString(),
    };

    // Build activeHours client DTO manually
    const activeHoursClientDTO = this._props.activeHours
      ? {
          ...this._props.activeHours.toServerDTO(),
          displayText: this._props.activeHours.enabled 
            ? `${this._props.activeHours.startHour}:00 - ${this._props.activeHours.endHour}:00`
            : '全天',
        }
      : null;

    // Build notificationConfig client DTO manually
    const notificationServerDTO = this._props.notificationConfig.toServerDTO();
    const notificationConfigClientDTO = {
      ...notificationServerDTO,
      channelsText: notificationServerDTO.channels.join(', ') || '无',
      hasSoundEnabled: notificationServerDTO.sound !== null,
      hasVibrationEnabled: notificationServerDTO.vibration !== null,
    };

    // Build stats client DTO manually
    const statsServerDTO = this._props.stats.toServerDTO();
    const statsClientDTO = {
      ...statsServerDTO,
      totalTriggersText: this._props.stats.totalTriggersText,
      lastTriggeredText: this._props.stats.lastTriggeredText,
    };

    const clientDTO: ReminderTemplateClientDTO = {
      id: this.uuid,
      identityId: this._props.identityId,
      name: this._props.title,
      description: this._props.description,
      type: this._props.type,
      trigger: triggerClientDTO,
      recurrence: recurrenceClientDTO,
      activeTime: activeTimeClientDTO,
      activeHours: activeHoursClientDTO,
      notificationConfig: notificationConfigClientDTO,
      selfEnabled: this._props.selfEnabled,
      status: this._props.status,
      effectiveEnabled: effectiveEnabled,
      groupId: this._props.groupUuid,
      importanceLevel: this._props.importanceLevel,
      tags: [...this._props.tags],
      color: this._props.color,
      icon: this._props.icon,
      nextTriggerAt: this._props.nextTriggerAt,
      stats: statsClientDTO,
      version: this._props.version,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt,

      // 子实体
      history: null,

      // UI 扩展
      displayTitle: this._props.title,
      typeText,
      triggerText: this._props.trigger.displayText,
      recurrenceText: recurrenceClientDTO?.displayText ?? null,
      statusText,
      importanceText,
      nextTriggerText: formatRelativeTime(this._props.nextTriggerAt),
      isActive: this._props.status === ReminderStatus.Active,
      isPaused: this._props.status === ReminderStatus.Paused,
      lastTriggeredText: formatRelativeTime(this._props.stats.lastTriggeredAt),
      controlledByGroup: controlledByGroup,
    };

    if (includeChildren && this._props.history.length > 0) {
      clientDTO.history = this._props.history.map((h) => h.toClientDTO());
    }

    return clientDTO;
  }

  /**
   * 转换为 Persistence DTO
   */
  public toPersistenceDTO(): ReminderTemplatePersistenceDTO {
    // 展开 ResponseMetrics 和 FrequencyAdjustment 的扁平字段
    const responseMetricsFlat = this._props.responseMetrics?.toDTO();
    const frequencyAdjustmentFlat = this._props.frequencyAdjustment?.toDTO();

    return {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.title,
      description: this._props.description,
      type: this._props.type,
      trigger: JSON.stringify(this._props.trigger.toServerDTO()),
      recurrence: this._props.recurrence ? JSON.stringify(this._props.recurrence.toServerDTO()) : null,
      activeTime: JSON.stringify(this._props.activeTime.toServerDTO()),
      activeHours: this._props.activeHours ? JSON.stringify(this._props.activeHours.toServerDTO()) : null,
      notificationConfig: JSON.stringify(this._props.notificationConfig.toServerDTO()),
      selfEnabled: this._props.selfEnabled,
      status: this._props.status,
      groupUuid: this._props.groupUuid,
      importanceLevel: this._props.importanceLevel,
      tags: JSON.stringify(this._props.tags),
      color: this._props.color,
      icon: this._props.icon,
      nextTriggerAt: this._props.nextTriggerAt !== null ? new Date(this._props.nextTriggerAt) : null,
      stats: JSON.stringify(this._props.stats.toServerDTO()),

      // Smart Frequency: Response Metrics（扁平化）
      clickRate: responseMetricsFlat?.clickRate ?? null,
      ignoreRate: responseMetricsFlat?.ignoreRate ?? null,
      avgResponseTime: responseMetricsFlat?.avgResponseTime ?? null,
      snoozeCount: responseMetricsFlat?.snoozeCount ?? 0,
      effectivenessScore: responseMetricsFlat?.effectivenessScore ?? null,
      sampleSize: responseMetricsFlat?.sampleSize ?? 0,
      lastAnalysisTime: responseMetricsFlat?.lastAnalysisTime ? new Date(responseMetricsFlat.lastAnalysisTime) : null,

      // Smart Frequency: Frequency Adjustment（扁平化）
      originalInterval: frequencyAdjustmentFlat?.originalInterval ?? null,
      adjustedInterval: frequencyAdjustmentFlat?.adjustedInterval ?? null,
      adjustmentReason: frequencyAdjustmentFlat?.adjustmentReason ?? null,
      adjustmentTime: frequencyAdjustmentFlat?.adjustmentTime ? new Date(frequencyAdjustmentFlat.adjustmentTime) : null,
      isAutoAdjusted: frequencyAdjustmentFlat?.isAutoAdjusted ?? false,
      userConfirmed: frequencyAdjustmentFlat?.userConfirmed ?? false,

      smartFrequencyEnabled: this._props.smartFrequencyEnabled ?? true,

      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      deletedAt: this._props.deletedAt !== null ? new Date(this._props.deletedAt) : null,
      version: this._props.version,
    } as ReminderTemplatePersistenceDTO;
  }
}
