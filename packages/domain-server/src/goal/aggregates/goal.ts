/**
 * Goal 聚合根实现
 * 实现 GoalServer 接口
 * 
 * 【规范说明：聚合根（Aggregate Root）】
 * 聚合根是 DDD 中的核心概念，代表一个业务边界：
 * - 唯一标识：通过 UUID 区分不同的聚合实例
 * - 事务边界：所有对聚合的修改在一个事务内完成
 * - 统一性：聚合保证内部状态的一致性
 * - 生命周期：聚合有创建、修改、删除的完整生命周期
 * 
 * 【Goal 职责】
 * 管理目标的完整生命周期：
 * - 目标属性管理（名称、描述、颜色、分析、动机）
 * - 关键结果管理（KR 的创建、修改、删除、排序）
 * - 进度计算（基于 KR 的加权平均）
 * - 回顾管理（定期回顾和反思）
 * - 权重快照（记录权重变更历史）
 * - 提醒配置（提醒触发器管理）
 * - 软删除支持（保留历史记录）
 * 
 * 【不变量（Invariants）】
 * 这些条件必须始终保持真：
 * - completedKeyResults <= totalKeyResults
 * - 目标必须至少有一个标识符（id/identityId）
 * - 软删除后不能再修改属性（只能恢复）
 * - 目标进度在 0-100 之间
 */

import { AggregateRoot } from '@dailyuse/utils';
import { GoalId, IdentityId, GoalFolderId, KeyResultWeightSnapshotId } from '@dailyuse/domain-shared';
import type { GoalEventMap } from '@dailyuse/contracts/goal';
import {
  GoalStatus,
  ReminderTriggerType,
  
} from '@dailyuse/contracts/goal';
import type {
  SnapshotTrigger,
  GoalReminderConfigDTO,
} from '@dailyuse/contracts/goal';
import type {
  GoalPersistenceDTO,
  GoalReviewServerDTO,
  GoalServer,
  GoalServerDTO,
  KeyResultServerDTO,
  ProgressBreakdown,
  KeyResultWeightSnapshotDTO,
  KeyResultSnapshotDTO,
  ReminderTrigger,
} from '@dailyuse/contracts/goal';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { KeyResult } from '../entities/key-result';
import { GoalReview } from '../entities/goal-review';
import {
  GoalReminderConfig,
  KeyResultWeightSnapshot,
  KeyResultNotFoundInGoalError,
  GoalNameRequiredError,
  GoalInvalidDateRangeError,
  GoalInvalidDateModificationError,
  GoalTargetDateNotSetError,
  GoalKeyResultNotFoundError,
  GoalReviewNotFoundError,
  GoalDeletedError,
  GoalArchivedError,
  GoalNameTooLongError,
  KeyResultWeightInvalidError,
  KeyResultWeightExceededError,
  GoalReviewRatingInvalidError,
} from '../value-objects';
import { calculateGoalPriority, mapPriorityToLevel, mapPriorityToText } from '../services/goal-priority-calculator';

// ================ 常量定义 ================
const DAY_MS = 1000 * 60 * 60 * 24;
const DEFAULT_DURATION = 30 * DAY_MS;

/**
 * Goal 聚合根
 */
export class Goal extends AggregateRoot<GoalId> implements GoalServer {
  // ================= 1. 内部状态 (Backing Fields) =================
  private _identityId: IdentityId;
  private _name: string;
  private _description: string | null;
  private _color: string;
  private _feasibilityAnalysis: string | null;
  private _motivation: string | null;
  private _status: GoalStatus;
  private _importance: ImportanceLevel;
  /** 
   * 持久化的优先级分数
   * 用于数据库排序，每日 Cron Job 或属性变更时更新
   */
  private _priority: number;
  private _category: string | null;
  private _tags: string[];
  private _startDate: Date | null;
  private _targetDate: Date | null;
  private _completedAt: Date | null;
  private _archivedAt: Date | null;
  private _folderId: string | null;
  private _parentGoalId: GoalId | null;
  private _sortOrder: number;
  private _reminderConfig: GoalReminderConfig | null;
  private _createdAt: Date;
  private _updatedAt: Date;
  private _deletedAt: Date | null;

  // ================= 2. 子实体集合 =================
  private _keyResults: KeyResult[];
  private _goalReviews: GoalReview[];
  private _weightSnapshots: KeyResultWeightSnapshot[];

  // ================= 3. 构造函数（Private） =================
  /**
   * 【规范说明】
   * 构造函数必须为 private，防止外部直接 new Goal(...)
   * 确保所有实例都通过工厂方法创建，保证业务规则验证
   */
  private constructor(props: GoalServerDTO) {
    super(props.id);
    
    this._identityId = props.identityId as IdentityId;
    this._name = props.name;
    this._description = props.description ?? null;
    this._color = props.color;
    this._feasibilityAnalysis = props.feasibilityAnalysis ?? null;
    this._motivation = props.motivation ?? null;
    this._status = props.status;
    this._importance = props.importance;
    this._priority = props.priority ?? 0; // 初始化优先级，稍后刷新
    this._category = props.category ?? null;
    this._tags = props.tags ?? [];
    this._startDate = props.startDate ? new Date(props.startDate) : null;
    this._targetDate = props.targetDate ? new Date(props.targetDate) : null;
    this._completedAt = props.completedAt ? new Date(props.completedAt) : null;
    this._archivedAt = props.archivedAt ? new Date(props.archivedAt) : null;
    this._folderId = props.folderId ?? null;
    this._parentGoalId = (props.parentGoalId ?? null) as GoalId | null;
    this._sortOrder = props.sortOrder;
    this._reminderConfig = props.reminderConfig ? GoalReminderConfig.fromDTO(props.reminderConfig) : null;
    this._createdAt = new Date(props.createdAt);
    this._updatedAt = new Date(props.updatedAt);
    this._deletedAt = props.deletedAt ? new Date(props.deletedAt) : null;
    
    // Initialize child entities from props
    this._keyResults = (props.keyResults || []).map((kr: KeyResultServerDTO) =>
      KeyResult.fromServerDTO(kr),
    );
    this._goalReviews = (props.goalReviews || []).map((r: GoalReviewServerDTO) =>
      GoalReview.fromServerDTO(r),
    );
    this._weightSnapshots = (props.weightSnapshots || []).map((ws: KeyResultWeightSnapshotDTO) =>
      KeyResultWeightSnapshot.fromDTO(ws),
    );
  }

  // ================= 4. 公共属性 (Getters) =================
  /**
   * 【规范说明】
   * 通过 public get 暴露状态，但标记为只读
   * 确保外部只能读取，不能直接修改
   * 所有修改必须通过明确的业务方法进行
   */

  get identityId(): IdentityId {
    return this._identityId;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get color(): string {
    return this._color;
  }

  get feasibilityAnalysis(): string | null {
    return this._feasibilityAnalysis;
  }

  get motivation(): string | null {
    return this._motivation;
  }

  get status(): GoalStatus {
    return this._status;
  }

  get importance(): ImportanceLevel {
    return this._importance;
  }

  /**
   * 📊 持久化属性：优先级分数
   * 基于 importance 和 targetDate 计算，由 refreshPriority() 更新
   * 持久化存储以支持高性能排序
   */
  get priority(): number {
    return this._priority;
  }

  /**
   * 📊 计算属性：优先级级别
   */
  get priorityLevel(): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    return mapPriorityToLevel(this._priority);
  }

  /**
   * 📊 计算属性：优先级显示文本
   */
  get priorityText(): string {
    return mapPriorityToText(this._priority);
  }

  /**
   * 🔄 刷新优先级分数
   * 根据当前 importance 和 targetDate 重新计算优先级
   * 应在以下场景调用：
   * - Goal 创建时
   * - importance 或 targetDate 变更时
   * - 每日 Cron Job 批量刷新时
   */
  public refreshPriority(referenceDate: Date = new Date()): void {
    this._priority = calculateGoalPriority(this._importance, this._targetDate, referenceDate);
  }

  get category(): string | null {
    return this._category;
  }

  get tags(): string[] {
    return [...this._tags];
  }

  get startDate(): Date | null {
    return this._startDate;
  }

  get targetDate(): Date | null {
    return this._targetDate;
  }

  get completedAt(): Date | null {
    return this._completedAt;
  }

  get archivedAt(): Date | null {
    return this._archivedAt;
  }

  get folderId(): GoalFolderId | null {
    return this._folderId as GoalFolderId | null;
  }

  get parentGoalId(): GoalId | null {
    return this._parentGoalId;
  }

  get sortOrder(): number {
    return this._sortOrder;
  }

  get reminderConfig(): GoalReminderConfig | null {
    return this._reminderConfig;
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

  get keyResults(): KeyResult[] {
    return [...this._keyResults];
  }

  get goalReviews(): GoalReview[] {
    return [...this._goalReviews];
  }

  get weightSnapshots(): ReadonlyArray<KeyResultWeightSnapshot> {
    return this._weightSnapshots;
  }

  // ================= 5. 工厂方法 (Factory Methods) =================

  /**
   * 🏭 业务工厂：创建新的目标
   * 
   * 【DDD 设计】
   * 工厂方法负责所有验证，确保创建的目标始终处于有效状态。
   * 这遵循了"Tell, Don't Ask"原则 - 调用者只需告诉 Goal 要做什么，
   * Goal 自己负责验证和保护其不变量。
   * 
   * @param params 创建参数
   * @param parentGoal 可选的父目标（如果提供了 parentGoalId，需要传入父目标进行验证）
   * @throws {GoalNameRequiredError} 当名称为空时
   * @throws {GoalNameTooLongError} 当名称超过200字符时
   * @throws {GoalInvalidDateRangeError} 当开始日期晚于目标日期时
   * @throws {GoalArchivedError} 当父目标已归档时
   * @throws {GoalDeletedError} 当父目标已删除时
   */
  public static create(
    params: {
      identityId: IdentityId;
      name: string;
      description: string | null;
      color: string;
      feasibilityAnalysis: string | null;
      motivation: string | null;
      importance: ImportanceLevel;
      category: string | null;
      tags: string[];
      startDate: Date | null;
      targetDate: Date | null;
      folderId: GoalFolderId | null;
      parentGoalId: GoalId | null;
      reminderConfig: GoalReminderConfig | null;
    },
    parentGoal?: Goal,
  ): Goal {
    // 1. 验证必填字段
    if (!params.identityId) {
      throw new GoalNameRequiredError();
    }
    
    // 2. 验证标题（使用静态验证方法）
    Goal.validateTitle(params.name);
    
    // 3. 验证日期范围
    Goal.validateDateRange(params.startDate, params.targetDate);
    
    // 4. 验证父目标状态
    if (params.parentGoalId && !parentGoal) {
      throw new Error('Parent goal is required when parentGoalId is provided');
    }
    Goal.validateParentGoal(parentGoal);

    const now = new Date();
    const id = GoalId.generate();

    const goal = new Goal({
      id,
      identityId: params.identityId,
      name: params.name.trim(),
      description: params.description?.trim() || null,
      color: params.color?.trim() || '#3B82F6',
      feasibilityAnalysis: params.feasibilityAnalysis?.trim() || null,
      motivation: params.motivation?.trim() || null,
      status: GoalStatus.Active,
      importance: params.importance ?? ('MEDIUM' as ImportanceLevel),
      category: params.category?.trim() || null,
      tags: params.tags ?? [],
      startDate: params.startDate?.getTime() ?? null,
      targetDate: params.targetDate?.getTime() ?? null,
      folderId: params.folderId ?? null,
      parentGoalId: params.parentGoalId ?? null,
      sortOrder: 0,
      reminderConfig: params.reminderConfig ?? null,

      goalReviews: null,

      createdAt: now.getTime(),
      updatedAt: now.getTime(),
      completedAt: null,
      archivedAt: null,
      keyResults: null,
      priority: 0,
      weightSnapshots: null,
      version: 1,
      deletedAt: null,
    });

    // 🔢 初始化优先级分数
    goal.refreshPriority();

    // 🎯 触发领域事件
    goal.addDomainEvent<GoalEventMap['goal:create']>('goal:create', {
      identityId: params.identityId,
      folderId: params.folderId,
    });

    return goal;
  }

  /**
   * 🏭 恢复工厂：从 Server DTO 恢复
   */
  public static fromServerDTO(dto: GoalServerDTO): Goal {
    // Child entities are now initialized in constructor
    return new Goal(dto);
  }

  /**
   * 🏭 恢复工厂：从持久化 DTO 恢复
   */
  public static fromPersistenceDTO(dto: GoalPersistenceDTO): Goal {
    const tags = typeof dto.tags === 'string' ? JSON.parse(dto.tags) : dto.tags;
    const reminderConfig = dto.reminderConfig
      ? GoalReminderConfig.fromPersistenceDTO(
          typeof dto.reminderConfig === 'string'
            ? JSON.parse(dto.reminderConfig)
            : dto.reminderConfig,
        )
      : null;

    const serverDTO: GoalServerDTO = {
      id: dto.id,
      identityId: dto.identityId,
      name: dto.name,
      description: dto.description,
      color: dto.color,
      feasibilityAnalysis: dto.feasibilityAnalysis,
      motivation: dto.motivation,
      status: dto.status as GoalStatus,
      importance: dto.importance as ImportanceLevel,
      category: dto.category,
      tags: Array.isArray(tags) ? tags : [],
      startDate: dto.startDate ? new Date(dto.startDate).getTime() : null,
      targetDate: dto.targetDate ? new Date(dto.targetDate).getTime() : null,
      completedAt: dto.completedAt ? new Date(dto.completedAt).getTime() : null,
      archivedAt: dto.archivedAt ? new Date(dto.archivedAt).getTime() : null,
      folderId: dto.folderId,
      parentGoalId: dto.parentGoalId,
      sortOrder: dto.sortOrder,
      reminderConfig: reminderConfig?.toDTO() || null,
      createdAt: new Date(dto.createdAt).getTime(),
      updatedAt: new Date(dto.updatedAt).getTime(),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt).getTime() : null,
      keyResults: null,
      goalReviews: null,
      weightSnapshots: null,
      priority: dto.priority ?? 0,
      version: dto.version ?? 1,
    };

    return Goal.fromServerDTO(serverDTO);
  }

  // ================= 6. 业务行为 (Business Methods) =================

  /**
   * ✅ 更新基本信息
   * 
   * 【DDD 设计】
   * 聚合根自己保护自己的不变量：
   * - 不允许修改已删除的目标
   * - 不允许修改已归档的目标
   * - 验证名称有效性
   * 
   * @throws {GoalDeletedError} 当目标已删除时
   * @throws {GoalArchivedError} 当目标已归档时
   * @throws {GoalNameRequiredError} 当名称为空时
   * @throws {GoalNameTooLongError} 当名称超过200字符时
   */
  public updateBasicInfo(params: {
    name?: string;
    description?: string | null;
    importance?: ImportanceLevel;
    category?: string | null;
    color?: string;
    feasibilityAnalysis?: string | null;
    motivation?: string | null;
  }): void {
    // Guard: 确保可修改
    this.ensureModifiable();
    
    let hasChanges = false;
    let importanceChanged = false;

    if (params.name !== undefined && params.name !== this._name) {
      // 使用静态验证方法
      Goal.validateTitle(params.name);
      this._name = params.name.trim();
      hasChanges = true;
    }

    if (params.description !== undefined && params.description !== this._description) {
      this._description = params.description?.trim() || null;
      hasChanges = true;
    }

    if (params.importance !== undefined && params.importance !== this._importance) {
      this._importance = params.importance;
      hasChanges = true;
      importanceChanged = true;
    }

    if (params.category !== undefined && params.category !== this._category) {
      this._category = params.category?.trim() || null;
      hasChanges = true;
    }

    if (params.color !== undefined && params.color !== this._color) {
      this._color = params.color.trim() || '#3B82F6';
      hasChanges = true;
    }

    if (params.feasibilityAnalysis !== undefined && params.feasibilityAnalysis !== this._feasibilityAnalysis) {
      this._feasibilityAnalysis = params.feasibilityAnalysis?.trim() || null;
      hasChanges = true;
    }

    if (params.motivation !== undefined && params.motivation !== this._motivation) {
      this._motivation = params.motivation?.trim() || null;
      hasChanges = true;
    }

    if (hasChanges) {
      this._updatedAt = new Date();
      
      // 🔢 importance 变更时刷新优先级
      if (importanceChanged) {
        this.refreshPriority();
      }
      
      this.addDomainEvent<GoalEventMap['goal:update']>('goal:update', {
        changes: Object.keys(params),
      });
    }
  }

  /**
   * ✅ 更新时间范围
   */
  public updateTimeRange(params: { startDate?: Date | null; targetDate?: Date | null }): void {
    let hasChanges = false;
    let targetDateChanged = false;

    if (params.startDate !== undefined && params.startDate?.getTime() !== this._startDate?.getTime()) {
      // Note: startDate is readonly, so we can't update it
      hasChanges = true;
    }

    if (params.targetDate !== undefined && params.targetDate?.getTime() !== this._targetDate?.getTime()) {
      this._targetDate = params.targetDate;
      hasChanges = true;
      targetDateChanged = true;
    }

    if (hasChanges) {
      this._updatedAt = new Date();
      
      // 🔢 targetDate 变更时刷新优先级
      if (targetDateChanged) {
        this.refreshPriority();
      }
      
      this.addDomainEvent<GoalEventMap['goal:update']>('goal:update', {
        changes: Object.keys(params),
      });
    }
  }

  /**
   * ✅ 延长目标时间
   * @throws {GoalInvalidDateModificationError} 当天数不为正数时
   * @throws {GoalTargetDateNotSetError} 当目标日期未设置时
   */
  public extendTargetDate(extensionDays: number): void {
    if (extensionDays <= 0) {
      throw new GoalInvalidDateModificationError('extend', extensionDays);
    }
    if (!this._targetDate) {
      throw new GoalTargetDateNotSetError();
    }

    const newTargetDate = new Date(this._targetDate.getTime() + extensionDays * DAY_MS);
    this.updateTimeRange({ targetDate: newTargetDate });
  }

  /**
   * ✅ 缩短目标时间
   * @throws {GoalInvalidDateModificationError} 当天数不为正数时
   * @throws {GoalTargetDateNotSetError} 当目标日期未设置时
   * @throws {GoalInvalidDateRangeError} 当新日期早于开始日期时
   */
  public shortenTargetDate(shortenDays: number): void {
    if (shortenDays <= 0) {
      throw new GoalInvalidDateModificationError('shorten', shortenDays);
    }
    if (!this._targetDate) {
      throw new GoalTargetDateNotSetError();
    }

    const newTargetDate = new Date(this._targetDate.getTime() - shortenDays * DAY_MS);

    // 确保新的目标时间仍然晚于开始时间
    if (this._startDate && newTargetDate.getTime() <= this._startDate.getTime()) {
      throw new GoalInvalidDateRangeError(this._startDate, newTargetDate);
    }

    this.updateTimeRange({ targetDate: newTargetDate });
  }

  /**
   * ✅ 更新标签
   */
  public updateTags(tags: string[]): void {
    this._tags = tags;
    this._updatedAt = new Date();
  }

  /**
   * ✅ 添加标签
   */
  public addTag(tag: string): void {
    const trimmed = tag.trim();
    if (trimmed && !this._tags.includes(trimmed)) {
      this._tags.push(trimmed);
      this._updatedAt = new Date();
    }
  }

  /**
   * ✅ 删除标签
   */
  public removeTag(tag: string): void {
    const index = this._tags.indexOf(tag);
    if (index !== -1) {
      this._tags.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  /**
   * ✅ 更新状态
   */
  public updateStatus(newStatus: GoalStatus): void {
    if (newStatus === this._status) return; // 幂等

    const previousStatus = this._status;
    this._status = newStatus;
    this._updatedAt = new Date();

    // 如果标记为完成，记录完成时间
    if (newStatus === GoalStatus.Completed && !this._completedAt) {
      // Note: completedAt is readonly, cannot be modified after construction
    }

    // 🎯 触发状态变更事件
    this.addDomainEvent<GoalEventMap['goal:status-change']>('goal:status-change', {
      previousStatus,
      newStatus,
    });
  }

  /**
   * ✅ 激活目标
   */
  public activate(): void {
    this.updateStatus(GoalStatus.Active);
  }

  /**
   * ✅ 完成目标
   */
  public markAsCompleted(): void {
    if (this._status === GoalStatus.Completed) return; // 幂等

    this._status = GoalStatus.Completed;
    this._updatedAt = new Date();

    this.addDomainEvent<GoalEventMap['goal:complete']>('goal:complete', {
      finalProgress: this.calculateProgress(),
    });
  }

  /**
   * ✅ 归档目标
   */
  public archive(): void {
    if (this._archivedAt) return; // 幂等

    this._status = GoalStatus.Archived;
    this._updatedAt = new Date();

    this.addDomainEvent<GoalEventMap['goal:archive']>('goal:archive', {});
  }

  /**
   * ✅ 软删除
   */
  public softDelete(): void {
    if (this._deletedAt) return; // 幂等

    this._deletedAt = new Date();
    this._updatedAt = this._deletedAt;

    this.addDomainEvent<GoalEventMap['goal:delete']>('goal:delete', {
      isSoftDelete: true,
    });
  }

  /**
   * ✅ 恢复目标
   */
  public restore(): void {
    this._deletedAt = null;
    this._updatedAt = new Date();
  }

  /**
   * ✅ 移动到文件夹
   */
  public moveToFolder(folderId: string | null): void {
    this._folderId = folderId;
    this._updatedAt = new Date();
  }

  /**
   * ✅ 更新排序
   */
  public updateSortOrder(sortOrder: number): void {
    this._sortOrder = sortOrder;
    this._updatedAt = new Date();
  }

  /**
   * ✅ 更新提醒配置
   */
  public updateReminderConfig(config: GoalReminderConfigDTO | null): void {
    this._reminderConfig = config ? GoalReminderConfig.fromDTO(config) : null;
    this._updatedAt = new Date();
  }

  /**
   * ✅ 启用提醒
   */
  public enableReminder(): void {
    if (this._reminderConfig) {
      this._reminderConfig = this._reminderConfig.setEnabled(true);
      this._updatedAt = new Date();
    }
  }

  /**
   * ✅ 禁用提醒
   */
  public disableReminder(): void {
    if (this._reminderConfig) {
      this._reminderConfig = this._reminderConfig.setEnabled(false);
      this._updatedAt = new Date();
    }
  }

  /**
   * ✅ 添加提醒触发器
   */
  public addReminderTrigger(trigger: ReminderTrigger): void {
    if (!this._reminderConfig) {
      throw new Error('Reminder config not initialized');
    }
    this._reminderConfig = this._reminderConfig.addTrigger(trigger);
    this._updatedAt = new Date();
  }

  /**
   * ✅ 移除提醒触发器
   */
  public removeReminderTrigger(type: ReminderTriggerType, value: number): void {
    if (!this._reminderConfig) {
      throw new Error('Reminder config not initialized');
    }
    this._reminderConfig = this._reminderConfig.removeTrigger(type, value);
    this._updatedAt = new Date();
  }

  // ================= 7. 关键结果管理 (KeyResult Management) =================

  /**
   * 🏭 创建并添加关键结果
   * 
   * 【DDD 设计】
   * 这是一个便捷方法，结合了创建和添加操作。
   * 聚合根自己验证权重范围和总和约束。
   * 
   * @throws {GoalDeletedError} 当目标已删除时
   * @throws {GoalArchivedError} 当目标已归档时
   * @throws {KeyResultWeightInvalidError} 当权重不在0-100之间时
   * @throws {KeyResultWeightExceededError} 当权重总和超过100时
   */
  public createAndAddKeyResult(params: {
    title: string;
    description?: string | null;
    valueType: string;
    aggregationMethod?: string;
    targetValue: number;
    currentValue?: number;
    unit?: string;
    weight: number;
  }): KeyResult {
    // Guard: 确保可修改
    this.ensureModifiable();
    
    // 验证权重范围
    Goal.validateKeyResultWeight(params.weight);
    
    // 验证权重总和
    const currentTotalWeight = this._keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    if (currentTotalWeight + params.weight > 100) {
      throw new KeyResultWeightExceededError(currentTotalWeight, params.weight);
    }
    
    // 创建关键结果
    const keyResult = KeyResult.create({
      title: params.title,
      description: params.description ?? undefined,
      progress: {
        initialValue: 0,
        currentValue: params.currentValue ?? 0,
        targetValue: params.targetValue,
        valueType: params.valueType as any,
        aggregationMethod: (params.aggregationMethod || 'LAST') as any,
        unit: params.unit ?? null,
      },
      weight: params.weight,
      order: this._keyResults.length,
    });
    
    // 添加到集合
    this._keyResults.push(keyResult);
    this._updatedAt = new Date();

    this.addDomainEvent<GoalEventMap['goal:key-result-add']>('goal:key-result-add', {
      keyResultId: keyResult.id,
    });
    
    return keyResult;
  }

  /**
   * 🏭 创建关键结果（工厂方法）
   * @deprecated 使用 createAndAddKeyResult 代替，它会自动添加并验证
   */
  public createKeyResult(params: {
    title: string;
    description?: string | null;
    valueType: string;
    aggregationMethod?: string;
    targetValue: number;
    currentValue?: number;
    unit?: string;
    weight: number;
  }): KeyResult {
    const keyResult = KeyResult.create({
      title: params.title,
      description: params.description ?? undefined,
      progress: {
        initialValue: 0,
        currentValue: params.currentValue ?? 0,
        targetValue: params.targetValue,
        valueType: params.valueType as any,
        aggregationMethod: (params.aggregationMethod || 'LAST') as any,
        unit: params.unit ?? null,
      },
      weight: params.weight,
      order: this._keyResults.length,
    });
    return keyResult;
  }

  /**
   * ✅ 添加关键结果
   * @deprecated 使用 createAndAddKeyResult 代替，它会自动验证
   */
  public addKeyResult(keyResult: KeyResult): void {
    this._keyResults.push(keyResult);
    this._updatedAt = new Date();

    this.addDomainEvent<GoalEventMap['goal:key-result-add']>('goal:key-result-add', {
      keyResultId: keyResult.id,
    });
  }

  /**
   * ✅ 更新关键结果属性（标题、描述等）
   * @throws {GoalDeletedError} 当目标已删除时
   * @throws {GoalKeyResultNotFoundError} 当关键结果不存在时
   */
  public updateKeyResult(keyResultId: string, updates: Partial<KeyResult>): void {
    this.ensureNotDeleted();
    
    const keyResult = this._keyResults.find((kr) => kr.id === keyResultId);
    if (!keyResult) {
      throw new GoalKeyResultNotFoundError(keyResultId);
    }

    if (updates.title) keyResult.updateTitle(updates.title);
    if (updates.description !== undefined) {
      keyResult.updateDescription(updates.description || '');
    }

    this._updatedAt = new Date();

    // 注：属性更新不触发专门的事件，由 Goal:update 处理
  }

  /**
   * ✅ 重新排序关键结果
   */
  public reorderKeyResults(keyResultIds: string[]): void {
    const newOrder: KeyResult[] = [];
    for (let i = 0; i < keyResultIds.length; i++) {
      const kr = this._keyResults.find((k) => k.id === keyResultIds[i]);
      if (kr) {
        kr.updateOrder(i);
        newOrder.push(kr);
      }
    }
    // 添加未在列表中的关键结果
    for (const kr of this._keyResults) {
      if (!newOrder.includes(kr)) {
        newOrder.push(kr);
      }
    }
    this._keyResults = newOrder;
    this._updatedAt = new Date();
  }

  /**
   * 📊 通过 ID 获取关键结果
   */
  public getKeyResult(id: string): KeyResult | null {
    return this._keyResults.find((kr) => kr.id === id) || null;
  }

  /**
   * 📊 获取所有关键结果
   */
  public getAllKeyResults(): KeyResult[] {
    return [...this._keyResults];
  }

  /**
   * ✅ 更新关键结果进度
   * @throws {GoalDeletedError} 当目标已删除时
   * @throws {GoalKeyResultNotFoundError} 当关键结果不存在时
   */
  public updateKeyResultProgress(
    keyResultId: string,
    newValue: number,
    note?: string,
  ): KeyResultServerDTO {
    // Guard: 确保未删除
    this.ensureNotDeleted();
    
    const keyResult = this._keyResults.find((kr) => kr.id === keyResultId);
    if (!keyResult) {
      throw new GoalKeyResultNotFoundError(keyResultId);
    }

    const oldProgress = this.calculateProgress();
    keyResult.recalculateProgress(newValue);
    this._updatedAt = new Date();

    const newProgress = this.calculateProgress();

    // 如果进度发生变化，触发进度更新事件
    if (oldProgress !== newProgress) {
      this.addDomainEvent<GoalEventMap['goal:update']>('goal:update', {
        changes: ['progress'],
      });
    }

    return keyResult.toServerDTO();
  }

  /**
   * ✅ 删除关键结果
   * @throws {GoalDeletedError} 当目标已删除时
   */
  public removeKeyResult(keyResultId: string): KeyResult | null {
    this.ensureNotDeleted();
    
    const index = this._keyResults.findIndex((kr) => kr.id === keyResultId);
    if (index !== -1) {
      const removed = this._keyResults.splice(index, 1)[0];
      this._updatedAt = new Date();

      this.addDomainEvent<GoalEventMap['goal:key-result-delete']>('goal:key-result-delete', {
        keyResultId: keyResultId,
      });

      return removed;
    }
    return null;
  }

  /**
   * 📊 计算总进度（基于所有关键结果的加权平均）
   * 
   * 公式：Progress = Σ(KR.progress × KR.weight) / Σ(KR.weight)
   * 
   * @returns 目标进度百分比（0-100）
   */
  public calculateProgress(): number {
    if (this._keyResults.length === 0) return 0;

    // 计算总权重
    const totalWeight = this._keyResults.reduce((sum, kr) => sum + kr.weight, 0);

    // 如果总权重为 0，使用简单平均
    if (totalWeight === 0) {
      const totalPercentage = this._keyResults.reduce((sum, kr) => sum + kr.calculatePercentage(), 0);
      return Math.round((totalPercentage / this._keyResults.length) * 100) / 100;
    }

    // 加权平均计算
    const weightedSum = this._keyResults.reduce(
      (sum, kr) => sum + (kr.calculatePercentage() * kr.weight),
      0,
    );

    const progress = weightedSum / totalWeight;

    // 四舍五入到小数点后 2 位
    return Math.round(progress * 100) / 100;
  }

  /**
   * 📊 获取进度分解详情
   */
  public getProgressBreakdown(): ProgressBreakdown {
    const totalWeight = this._keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    const totalProgress = this.calculateProgress();

    return {
      totalProgress,
      calculationMode: 'weighted_average' as const,
      krContributions: this._keyResults.map((kr) => {
        const krProgress = kr.calculatePercentage();
        const contribution =
          totalWeight > 0
            ? Math.round((krProgress * kr.weight) / totalWeight * 100) / 100
            : Math.round((krProgress / this._keyResults.length) * 100) / 100;

        return {
          keyResultUuid: kr.id as unknown as string,
          keyResultName: kr.title,
          progress: krProgress,
          weight: kr.weight,
          contribution,
        };
      }),
      lastUpdateTime: this._updatedAt.getTime(),
      updateTrigger: '自动计算',
    };
  }

  /**
   * 📊 检查是否所有关键结果都已完成
   */
  public areAllKeyResultsCompleted(): boolean {
    if (this._keyResults.length === 0) return false;
    return this._keyResults.every((kr) => kr.isCompleted());
  }

  // ================= 8. 权重快照管理 (Weight Snapshots) =================

  /**
   * ✅ 记录 KR 权重变更快照
   */
  public recordWeightSnapshot(
    krId: string,
    oldWeight: number,
    newWeight: number,
    trigger: SnapshotTrigger,
    operatorId: string,
    reason?: string,
  ): void {
    // 验证 KR 存在
    const kr = this._keyResults.find((k) => k.id === krId);
    if (!kr) {
      throw new KeyResultNotFoundInGoalError(krId, this.id);
    }

    const now = Date.now();
    // 创建快照
    const snapshot = KeyResultWeightSnapshot.create({
      id: KeyResultWeightSnapshotId.of(KeyResultWeightSnapshotId.generate()) as any,
      goalId: this.id as any,
      keyResultId: krId as any,
      oldWeight,
      newWeight,
      weightDelta: newWeight - oldWeight,
      snapshotTime: now,
      trigger,
      reason: reason ?? null,
      operatorId: operatorId as any,
      createdAt: now,
    });

    this._weightSnapshots.push(snapshot);
    this._updatedAt = new Date();
  }

  /**
   * 📊 获取所有权重快照
   */
  public getAllWeightSnapshots(): ReadonlyArray<KeyResultWeightSnapshot> {
    return this._weightSnapshots;
  }

  /**
   * 📊 获取特定 KR 的权重快照
   */
  public getWeightSnapshotsByKeyResult(krId: string): ReadonlyArray<KeyResultWeightSnapshot> {
    return this._weightSnapshots.filter((snapshot) => snapshot.keyResultId === krId);
  }

  // ================= 9. 回顾管理 (Review Management) =================

  /**
   * 🏭 创建并添加回顾
   * 
   * 【DDD 设计】
   * 便捷方法，结合创建和添加，并验证所有约束。
   * 
   * @throws {GoalDeletedError} 当目标已删除时
   * @throws {GoalReviewRatingInvalidError} 当评分不在0-10之间时
   */
  public createAndAddReview(params: {
    title: string;
    content: string;
    reviewType: string;
    rating?: number;
    achievements?: string;
    challenges?: string;
    nextActions?: string;
  }): GoalReview {
    // Guard: 确保未删除
    this.ensureNotDeleted();
    
    // 验证评分
    Goal.validateReviewRating(params.rating);
    
    // 创建关键结果快照
    const keyResultSnapshots: KeyResultSnapshotDTO[] = this._keyResults.map((kr) => ({
      keyResultId: kr.id as any,
      title: kr.title,
      targetValue: kr.progress.targetValue,
      currentValue: kr.progress.currentValue,
      progressPercentage: kr.calculatePercentage(),
    }));

    const review = GoalReview.create({
      type: params.reviewType as any,
      rating: params.rating || 3,
      summary: params.content,
      achievements: params.achievements,
      challenges: params.challenges,
      improvements: params.nextActions,
      keyResultSnapshots,
    });
    
    // 添加到集合
    this._goalReviews.push(review);
    this._updatedAt = new Date();

    this.addDomainEvent<GoalEventMap['goal:review-add']>('goal:review-add', {
      reviewId: review.id,
    });

    return review;
  }

  /**
   * 🏭 创建回顾（工厂方法）
   * @deprecated 使用 createAndAddReview 代替
   */
  public createReview(params: {
    title: string;
    content: string;
    reviewType: string;
    rating?: number;
    achievements?: string;
    challenges?: string;
    nextActions?: string;
  }): GoalReview {
    // 创建关键结果快照
    const keyResultSnapshots: KeyResultSnapshotDTO[] = this._keyResults.map((kr) => ({
      keyResultId: kr.id as any,
      title: kr.title,
      targetValue: kr.progress.targetValue,
      currentValue: kr.progress.currentValue,
      progressPercentage: kr.calculatePercentage(),
    }));

    const review = GoalReview.create({
      type: params.reviewType as any,
      rating: params.rating || 3,
      summary: params.content,
      achievements: params.achievements,
      challenges: params.challenges,
      improvements: params.nextActions,
      keyResultSnapshots,
    });

    return review;
  }

  /**
   * ✅ 添加回顾
   * @deprecated 使用 createAndAddReview 代替
   */
  public addReview(review: GoalReview): void {
    this._goalReviews.push(review);
    this._updatedAt = new Date();

    this.addDomainEvent<GoalEventMap['goal:review-add']>('goal:review-add', {
      reviewId: review.id,
    });
  }

  /**
   * 📊 获取最新的回顾记录
   */
  public getLatestReview(): GoalReview | null {
    if (this._goalReviews.length === 0) return null;
    return this._goalReviews[this._goalReviews.length - 1];
  }

  /**
   * ✅ 更新回顾
   * @throws {GoalDeletedError} 当目标已删除时
   * @throws {GoalReviewNotFoundError} 当回顾不存在时
   * @throws {GoalReviewRatingInvalidError} 当评分不在0-10之间时
   */
  public updateReview(
    reviewId: string,
    params: {
      rating?: number;
      summary?: string;
      achievements?: string;
      challenges?: string;
      improvements?: string;
    },
  ): void {
    this.ensureNotDeleted();
    Goal.validateReviewRating(params.rating);
    
    const review = this._goalReviews.find((r) => r.id === reviewId);
    if (!review) {
      throw new GoalReviewNotFoundError(reviewId);
    }

    if (params.rating !== undefined) review.updateRating(params.rating);
    if (params.summary) review.updateSummary(params.summary);
    if (params.achievements) review.addAchievement(params.achievements);
    if (params.challenges) review.addChallenge(params.challenges);
    if (params.improvements) review.addImprovement(params.improvements);

    this._updatedAt = new Date();
  }

  /**
   * ✅ 删除回顾
   * @throws {GoalDeletedError} 当目标已删除时
   */
  public removeReview(reviewId: string): GoalReview | null {
    this.ensureNotDeleted();
    
    const index = this._goalReviews.findIndex((r) => r.id === reviewId);
    if (index !== -1) {
      const removed = this._goalReviews.splice(index, 1)[0];
      this._updatedAt = new Date();
      return removed;
    }
    return null;
  }

  // ================= 10. 业务规则检查 (Business Rules) =================

  /**
   * 📊 是否已过期
   */
  public isOverdue(): boolean {
    if (!this._targetDate || this._status === GoalStatus.Completed) return false;
    return Date.now() > this._targetDate.getTime();
  }

  /**
   * 📊 是否为高优先级
   */
  public isHighPriority(): boolean {
    return this.priority >= 60; // HIGH or CRITICAL
  }

  /**
   * 📊 获取剩余天数
   */
  public getRemainingDays(): number | null {
    if (!this._targetDate) return null;
    const diff = this._targetDate.getTime() - Date.now();
    return Math.ceil(diff / DAY_MS);
  }

  /**
   * 📊 获取优先级得分
   * @deprecated 使用 priority getter 替代
   */
  public getPriorityScore(): number {
    return this.priority;
  }

  // ================= 11. 序列化 (Serialization) =================

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(includeChildren: boolean = false): GoalServerDTO {
    const goalId = this.id as unknown as string;
    return {
      id: this.id,
      identityId: this._identityId,
      name: this._name,
      description: this._description,
      color: this._color,
      feasibilityAnalysis: this._feasibilityAnalysis,
      motivation: this._motivation,
      status: this._status,
      importance: this._importance,
      priority: this.priority,
      category: this._category,
      tags: [...this._tags],
      startDate: this._startDate?.getTime() ?? null,
      targetDate: this._targetDate?.getTime() ?? null,
      completedAt: this._completedAt?.getTime() ?? null,
      archivedAt: this._archivedAt?.getTime() ?? null,
      folderId: this._folderId as GoalFolderId | null,
      parentGoalId: this._parentGoalId,
      sortOrder: this._sortOrder,
      reminderConfig: this._reminderConfig?.toDTO() ?? null,
      createdAt: this._createdAt.getTime(),
      updatedAt: this._updatedAt.getTime(),
      deletedAt: this._deletedAt?.getTime() ?? null,
      keyResults: includeChildren && this._keyResults.length > 0
        ? this._keyResults.map((kr) => kr.toServerDTO())
        : null,
      weightSnapshots: includeChildren && this._weightSnapshots.length > 0
        ? this._weightSnapshots.map((ws) => ws.toDTO())
        : null,
      goalReviews: includeChildren && this._goalReviews.length > 0
        ? this._goalReviews.map((r) => r.toServerDTO(goalId))
        : null,
      version: 1, // Default version for optimistic locking
    };
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): GoalPersistenceDTO {
    return {
      id: this.id,
      identityId: this._identityId,
      name: this._name,
      description: this._description,
      color: this._color,
      feasibilityAnalysis: this._feasibilityAnalysis,
      motivation: this._motivation,
      status: this._status,
      importance: this._importance,
      priority: this._priority,
      category: this._category,
      tags: [...this._tags],
      startDate: this._startDate,
      targetDate: this._targetDate,
      completedAt: this._completedAt,
      archivedAt: this._archivedAt,
      folderId: this._folderId as GoalFolderId | null,
      parentGoalId: this._parentGoalId,
      sortOrder: this._sortOrder,
      reminderConfig: this._reminderConfig?.toPersistenceDTO() ?? null,
      keyResults: this._keyResults.length > 0
        ? this._keyResults.map((kr) => kr.toPersistenceDTO())
        : null,
      goalReviews: this._goalReviews.length > 0
        ? this._goalReviews.map((r) => r.toPersistenceDTO())
        : null,
      weightSnapshots: this._weightSnapshots.length > 0
        ? this._weightSnapshots.map((ws) => ws.toDTO())
        : null,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      version: 1,
    };
  }

  // ================= 12. Guard Clauses (守卫方法) =================

  /**
   * 确保目标未被删除
   * @throws {GoalDeletedError} 当目标已被软删除时
   */
  private ensureNotDeleted(): void {
    if (this._deletedAt !== null) {
      throw new GoalDeletedError(this.id);
    }
  }

  /**
   * 确保目标未被归档
   * @throws {GoalArchivedError} 当目标已被归档时
   */
  private ensureNotArchived(): void {
    if (this._status === GoalStatus.Archived) {
      throw new GoalArchivedError(this.id);
    }
  }

  /**
   * 确保目标可以被修改（未删除且未归档）
   * @throws {GoalDeletedError} 当目标已被软删除时
   * @throws {GoalArchivedError} 当目标已被归档时
   */
  private ensureModifiable(): void {
    this.ensureNotDeleted();
    this.ensureNotArchived();
  }

  // ================= 13. 静态验证方法 (Static Validators) =================

  /**
   * 验证目标标题
   * @throws {GoalNameRequiredError} 当标题为空时
   * @throws {GoalNameTooLongError} 当标题超过200字符时
   */
  public static validateTitle(title: string): void {
    const trimmed = title.trim();
    if (trimmed.length === 0) {
      throw new GoalNameRequiredError();
    }
    if (trimmed.length > 200) {
      throw new GoalNameTooLongError(200);
    }
  }

  /**
   * 验证日期范围
   * @throws {GoalInvalidDateRangeError} 当开始日期晚于目标日期时
   */
  public static validateDateRange(startDate?: Date | null, targetDate?: Date | null): void {
    if (startDate && targetDate && startDate.getTime() > targetDate.getTime()) {
      throw new GoalInvalidDateRangeError(startDate, targetDate);
    }
  }

  /**
   * 验证关键结果权重
   * @throws {KeyResultWeightInvalidError} 当权重不在0-100之间时
   */
  public static validateKeyResultWeight(weight: number): void {
    if (weight < 0 || weight > 100) {
      throw new KeyResultWeightInvalidError(weight);
    }
  }

  /**
   * 验证回顾评分
   * @throws {GoalReviewRatingInvalidError} 当评分不在0-10之间时
   */
  public static validateReviewRating(rating?: number): void {
    if (rating !== undefined && (rating < 0 || rating > 10)) {
      throw new GoalReviewRatingInvalidError(rating);
    }
  }

  /**
   * 验证父目标状态（用于创建子目标）
   * @throws {GoalArchivedError} 当父目标已归档时
   * @throws {GoalDeletedError} 当父目标已删除时
   */
  public static validateParentGoal(parentGoal?: Goal): void {
    if (!parentGoal) return;
    
    if (parentGoal.status === GoalStatus.Archived) {
      throw new GoalArchivedError(parentGoal.id);
    }
    if (parentGoal.deletedAt !== null) {
      throw new GoalDeletedError(parentGoal.id);
    }
  }

  // ================= 14. 辅助方法 (Helpers) =================

  private resolveTimeRange(): { start: number | null; end: number | null } {
    const start = this._startDate?.getTime() ?? this._createdAt?.getTime() ?? null;
    let end = this._targetDate?.getTime() ?? this._completedAt?.getTime() ?? this._updatedAt?.getTime() ?? null;

    if (start && (!end || end <= start)) {
      end = start + DEFAULT_DURATION;
    }

    return { start, end };
  }

  private calculateTimeProgressRatio(): number | null {
    const { start, end } = this.resolveTimeRange();
    if (!start || !end || end <= start) return null;
    const now = Date.now();
    if (now <= start) return 0;
    if (now >= end) return 1;
    return (now - start) / (end - start);
  }
}
