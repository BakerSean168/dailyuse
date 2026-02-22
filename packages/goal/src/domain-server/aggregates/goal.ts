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
import { IdentityId } from '@dailyuse/domain-shared';
import { GoalId, GoalFolderId, KeyResultWeightSnapshotId, KeyResultId } from '../../domain-shared';
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
  KeyResultPersistenceDTO,
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
 * Goal 内部状态接口
 * 使用 GoalServer 作为基础，但覆盖子实体为实际的类类型
 */
interface GoalState extends Omit<GoalServer, 'keyResults' | 'goalReviews' | 'reminderConfig'> {
  reminderConfig: GoalReminderConfig | null;
  keyResults: KeyResult[];
  goalReviews: GoalReview[];
  weightSnapshots: KeyResultWeightSnapshot[];
}

/**
 * Goal 聚合根
 */
export class Goal extends AggregateRoot<GoalId> implements GoalServer {
  // ================= 1. 内部状态 (Props Pattern) =================
  /**
   * 使用单一 _props 对象存储所有内部状态
   * 注意：非 readonly，因为需要支持 mutation 方法
   */
  private _props: GoalState;

  // ================= 2. 构造函数（Private） =================
  /**
   * 【规范说明】
   * 构造函数必须为 private，防止外部直接 new Goal(...)
   * 确保所有实例都通过工厂方法创建，保证业务规则验证
   */
  private constructor(params: {
    id: GoalId;
    identityId: IdentityId;
    name: string;
    description: string | null;
    color: string;
    feasibilityAnalysis: string | null;
    motivation: string | null;
    status: GoalStatus;
    importance: ImportanceLevel;
    priority: number;
    category: string | null;
    tags: string[];
    startDate: Date | null;
    targetDate: Date | null;
    completedAt: Date | null;
    archivedAt: Date | null;
    folderId: GoalFolderId | null;
    parentGoalId: GoalId | null;
    sortOrder: number;
    reminderConfig: GoalReminderConfig | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    keyResults: KeyResult[];
    goalReviews: GoalReview[];
    weightSnapshots: KeyResultWeightSnapshot[];
  }) {
    super(params.id);
    
    this._props = {
      id: params.id,
      identityId: params.identityId,
      name: params.name,
      description: params.description ?? null,
      color: params.color,
      feasibilityAnalysis: params.feasibilityAnalysis ?? null,
      motivation: params.motivation ?? null,
      status: params.status,
      importance: params.importance,
      priority: params.priority ?? 0,
      category: params.category ?? null,
      tags: params.tags ?? [],
      startDate: params.startDate ?? null,
      targetDate: params.targetDate ?? null,
      completedAt: params.completedAt ?? null,
      archivedAt: params.archivedAt ?? null,
      folderId: params.folderId ?? null,
      parentGoalId: params.parentGoalId ?? null,
      sortOrder: params.sortOrder,
      reminderConfig: params.reminderConfig ?? null,
      version: params.version ?? 1,
      createdAt: params.createdAt,
      updatedAt: params.updatedAt,
      deletedAt: params.deletedAt ?? null,
      keyResults: params.keyResults ?? [],
      goalReviews: params.goalReviews ?? [],
      weightSnapshots: params.weightSnapshots ?? [],
    };
  }

  // ================= 3. 公共属性 (Getters) =================
  /**
   * 【规范说明】
   * 通过 public get 暴露状态，但标记为只读
   * 确保外部只能读取，不能直接修改
   * 所有修改必须通过明确的业务方法进行
   */

  get identityId(): IdentityId {
    return this._props.identityId;
  }

  get name(): string {
    return this._props.name;
  }

  get description(): string | null {
    return this._props.description;
  }

  get color(): string {
    return this._props.color;
  }

  get feasibilityAnalysis(): string | null {
    return this._props.feasibilityAnalysis;
  }

  get motivation(): string | null {
    return this._props.motivation;
  }

  get status(): GoalStatus {
    return this._props.status;
  }

  get importance(): ImportanceLevel {
    return this._props.importance;
  }

  /**
   * 📊 持久化属性：优先级分数
   * 基于 importance 和 targetDate 计算，由 refreshPriority() 更新
   * 持久化存储以支持高性能排序
   */
  get priority(): number {
    return this._props.priority;
  }

  /**
   * 📊 计算属性：优先级级别
   */
  get priorityLevel(): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    return mapPriorityToLevel(this._props.priority);
  }

  /**
   * 📊 计算属性：优先级显示文本
   */
  get priorityText(): string {
    return mapPriorityToText(this._props.priority);
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
    this._props.priority = calculateGoalPriority(this._props.importance, this._props.targetDate, referenceDate);
  }

  get category(): string | null {
    return this._props.category;
  }

  get tags(): string[] {
    return [...this._props.tags];
  }

  get startDate(): Date | null {
    return this._props.startDate;
  }

  get targetDate(): Date | null {
    return this._props.targetDate;
  }

  get completedAt(): Date | null {
    return this._props.completedAt;
  }

  get archivedAt(): Date | null {
    return this._props.archivedAt;
  }

  get folderId(): GoalFolderId | null {
    return this._props.folderId as GoalFolderId | null;
  }

  get parentGoalId(): GoalId | null {
    return this._props.parentGoalId;
  }

  get sortOrder(): number {
    return this._props.sortOrder;
  }

  get reminderConfig(): GoalReminderConfig | null {
    return this._props.reminderConfig;
  }

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

  get keyResults(): KeyResult[] {
    return [...this._props.keyResults];
  }

  get goalReviews(): GoalReview[] {
    return [...this._props.goalReviews];
  }

  get weightSnapshots(): ReadonlyArray<KeyResultWeightSnapshot> {
    return this._props.weightSnapshots;
  }

  /**
   * 获取目标进度（基于关键结果加权计算）
   */
  get progress(): number {
    return this.calculateProgress();
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
   * 【本地优先支持】
   * - 支持通过 params.id 传入前端生成的 ID
   * - 如果不提供则自动生成
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
      id?: GoalId; // 支持前端生成 ID（本地优先）
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
    const id = params.id ?? GoalId.generate(); // 支持前端生成 ID

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
      priority: 0,
      category: params.category?.trim() || null,
      tags: params.tags ?? [],
      startDate: params.startDate ?? null,
      targetDate: params.targetDate ?? null,
      completedAt: null,
      archivedAt: null,
      folderId: params.folderId ?? null,
      parentGoalId: params.parentGoalId ?? null,
      sortOrder: 0,
      reminderConfig: params.reminderConfig ?? null,
      version: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      keyResults: [],
      goalReviews: [],
      weightSnapshots: [],
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
    // Initialize child entities from DTO
    const keyResults = (dto.keyResults || []).map((kr: KeyResultServerDTO) =>
      KeyResult.load({
        id: KeyResultId.of(kr.id),
        title: kr.title,
        description: kr.description ?? null,
        progress: kr.progress,
        weight: kr.weight,
        sortOrder: kr.sortOrder,
        version: kr.version ?? 1,
        createdAt: new Date(kr.createdAt),
        updatedAt: new Date(kr.updatedAt),
        deletedAt: kr.deletedAt ? new Date(kr.deletedAt) : null,
      }),
    );
    const goalReviews = (dto.goalReviews || []).map((r: GoalReviewServerDTO) =>
      GoalReview.fromServerDTO(r),
    );
    const weightSnapshots = (dto.weightSnapshots || []).map((ws: KeyResultWeightSnapshotDTO) =>
      KeyResultWeightSnapshot.fromDTO(ws),
    );

    return new Goal({
      id: GoalId.of(dto.id),
      identityId: IdentityId.of(dto.identityId),
      name: dto.name,
      description: dto.description ?? null,
      color: dto.color,
      feasibilityAnalysis: dto.feasibilityAnalysis ?? null,
      motivation: dto.motivation ?? null,
      status: dto.status,
      importance: dto.importance,
      priority: dto.priority ?? 0,
      category: dto.category ?? null,
      tags: dto.tags ?? [],
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
      completedAt: dto.completedAt ? new Date(dto.completedAt) : null,
      archivedAt: dto.archivedAt ? new Date(dto.archivedAt) : null,
      folderId: dto.folderId ? GoalFolderId.of(dto.folderId) : null,
      parentGoalId: dto.parentGoalId ? GoalId.of(dto.parentGoalId) : null,
      sortOrder: dto.sortOrder,
      reminderConfig: dto.reminderConfig ? GoalReminderConfig.fromDTO(dto.reminderConfig) : null,
      version: dto.version ?? 1,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      deletedAt: dto.deletedAt ? new Date(dto.deletedAt) : null,
      keyResults,
      goalReviews,
      weightSnapshots,
    });
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

    if (params.name !== undefined && params.name !== this._props.name) {
      // 使用静态验证方法
      Goal.validateTitle(params.name);
      this._props.name = params.name.trim();
      hasChanges = true;
    }

    if (params.description !== undefined && params.description !== this._props.description) {
      this._props.description = params.description?.trim() || null;
      hasChanges = true;
    }

    if (params.importance !== undefined && params.importance !== this._props.importance) {
      this._props.importance = params.importance;
      hasChanges = true;
      importanceChanged = true;
    }

    if (params.category !== undefined && params.category !== this._props.category) {
      this._props.category = params.category?.trim() || null;
      hasChanges = true;
    }

    if (params.color !== undefined && params.color !== this._props.color) {
      this._props.color = params.color.trim() || '#3B82F6';
      hasChanges = true;
    }

    if (params.feasibilityAnalysis !== undefined && params.feasibilityAnalysis !== this._props.feasibilityAnalysis) {
      this._props.feasibilityAnalysis = params.feasibilityAnalysis?.trim() || null;
      hasChanges = true;
    }

    if (params.motivation !== undefined && params.motivation !== this._props.motivation) {
      this._props.motivation = params.motivation?.trim() || null;
      hasChanges = true;
    }

    if (hasChanges) {
      this._props.updatedAt = new Date();
      
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

    if (params.startDate !== undefined && params.startDate?.getTime() !== this._props.startDate?.getTime()) {
      // Note: startDate is readonly, so we can't update it
      hasChanges = true;
    }

    if (params.targetDate !== undefined && params.targetDate?.getTime() !== this._props.targetDate?.getTime()) {
      this._props.targetDate = params.targetDate;
      hasChanges = true;
      targetDateChanged = true;
    }

    if (hasChanges) {
      this._props.updatedAt = new Date();
      
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
    if (!this._props.targetDate) {
      throw new GoalTargetDateNotSetError();
    }

    const newTargetDate = new Date(this._props.targetDate.getTime() + extensionDays * DAY_MS);
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
    if (!this._props.targetDate) {
      throw new GoalTargetDateNotSetError();
    }

    const newTargetDate = new Date(this._props.targetDate.getTime() - shortenDays * DAY_MS);

    // 确保新的目标时间仍然晚于开始时间
    if (this._props.startDate && newTargetDate.getTime() <= this._props.startDate.getTime()) {
      throw new GoalInvalidDateRangeError(this._props.startDate, newTargetDate);
    }

    this.updateTimeRange({ targetDate: newTargetDate });
  }

  /**
   * ✅ 更新标签
   */
  public updateTags(tags: string[]): void {
    this._props.tags = tags;
    this._props.updatedAt = new Date();
  }

  /**
   * ✅ 添加标签
   */
  public addTag(tag: string): void {
    const trimmed = tag.trim();
    if (trimmed && !this._props.tags.includes(trimmed)) {
      this._props.tags.push(trimmed);
      this._props.updatedAt = new Date();
    }
  }

  /**
   * ✅ 删除标签
   */
  public removeTag(tag: string): void {
    const index = this._props.tags.indexOf(tag);
    if (index !== -1) {
      this._props.tags.splice(index, 1);
      this._props.updatedAt = new Date();
    }
  }

  /**
   * ✅ 更新状态
   */
  public updateStatus(newStatus: GoalStatus): void {
    if (newStatus === this._props.status) return; // 幂等

    const previousStatus = this._props.status;
    this._props.status = newStatus;
    this._props.updatedAt = new Date();

    // 如果标记为完成，记录完成时间
    if (newStatus === GoalStatus.Completed && !this._props.completedAt) {
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
    if (this._props.status === GoalStatus.Completed) return; // 幂等

    this._props.status = GoalStatus.Completed;
    this._props.updatedAt = new Date();

    this.addDomainEvent<GoalEventMap['goal:complete']>('goal:complete', {
      finalProgress: this.calculateProgress(),
    });
  }

  /**
   * ✅ 归档目标
   * 
   * 归档 = 原来的 "软删除"。归档后的目标不会在列表中显示，
   * 但数据不会被物理删除。可通过 restore() 恢复。
   * 
   * 前置条件：
   * - 目标尚未归档（幂等）
   * - 活跃目标必须先完成才能归档
   */
  public archive(): void {
    if (this._props.archivedAt) return; // 幂等
    if (this._props.status === GoalStatus.Active) {
      throw new Error('Active goals must be completed before archiving');
    }

    const now = new Date();
    this._props.status = GoalStatus.Archived;
    this._props.archivedAt = now;
    this._props.deletedAt = now; // 兼容现有查询过滤
    this._props.updatedAt = now;

    this.addDomainEvent<GoalEventMap['goal:archive']>('goal:archive', {});
  }

  /**
   * ✅ 恢复归档的目标
   * 
   * 将归档目标恢复为已完成状态
   */
  public restore(): void {
    if (!this._props.archivedAt) return; // 非归档状态无需恢复

    this._props.archivedAt = null;
    this._props.deletedAt = null;
    this._props.status = GoalStatus.Completed; // 恢复为完成状态（归档前一定是已完成的）
    this._props.updatedAt = new Date();
  }

  /**
   * ✅ 检查是否可以永久删除
   * 
   * 只有已归档的目标才能被永久删除。
   */
  public canBePermanentlyDeleted(): boolean {
    return this._props.archivedAt !== null;
  }

  /**
   * ✅ 移动到文件夹
   */
  public moveToFolder(folderId: GoalFolderId | null): void {
    this._props.folderId = folderId;
    this._props.updatedAt = new Date();
  }

  /**
   * ✅ 更新排序
   */
  public updateSortOrder(sortOrder: number): void {
    this._props.sortOrder = sortOrder;
    this._props.updatedAt = new Date();
  }

  /**
   * ✅ 更新提醒配置
   */
  public updateReminderConfig(config: GoalReminderConfigDTO | null): void {
    this._props.reminderConfig = config ? GoalReminderConfig.fromDTO(config) : null;
    this._props.updatedAt = new Date();
  }

  /**
   * ✅ 启用提醒
   */
  public enableReminder(): void {
    if (this._props.reminderConfig) {
      this._props.reminderConfig = this._props.reminderConfig.setEnabled(true);
      this._props.updatedAt = new Date();
    }
  }

  /**
   * ✅ 禁用提醒
   */
  public disableReminder(): void {
    if (this._props.reminderConfig) {
      this._props.reminderConfig = this._props.reminderConfig.setEnabled(false);
      this._props.updatedAt = new Date();
    }
  }

  /**
   * ✅ 添加提醒触发器
   */
  public addReminderTrigger(trigger: ReminderTrigger): void {
    if (!this._props.reminderConfig) {
      throw new Error('Reminder config not initialized');
    }
    this._props.reminderConfig = this._props.reminderConfig.addTrigger(trigger);
    this._props.updatedAt = new Date();
  }

  /**
   * ✅ 移除提醒触发器
   */
  public removeReminderTrigger(type: ReminderTriggerType, value: number): void {
    if (!this._props.reminderConfig) {
      throw new Error('Reminder config not initialized');
    }
    this._props.reminderConfig = this._props.reminderConfig.removeTrigger(type, value);
    this._props.updatedAt = new Date();
  }

  // ================= 4. 关键结果管理 (KeyResult Management) =================

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
    const currentTotalWeight = this._props.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
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
      sortOrder: this._props.keyResults.length,
    });
    
    // 添加到集合
    this._props.keyResults.push(keyResult);
    this._props.updatedAt = new Date();

    this.addDomainEvent<GoalEventMap['goal:key-result-add']>('goal:key-result-add', {
      keyResultId: keyResult.id,
    });
    
    return keyResult;
  }

  /**
   * ✅ 更新关键结果属性（标题、描述等）
   * @throws {GoalDeletedError} 当目标已删除时
   * @throws {GoalKeyResultNotFoundError} 当关键结果不存在时
   */
  public updateKeyResult(
    keyResultId: string,
    updates: {
      title?: string;
      description?: string | null;
      weight?: number;
      targetValue?: number;
      unit?: string | null;
    },
  ): void {
    this.ensureModifiable();
    
    const keyResult = this._props.keyResults.find((kr) => kr.id === keyResultId);
    if (!keyResult) {
      throw new GoalKeyResultNotFoundError(keyResultId);
    }

    if (updates.title) keyResult.updateTitle(updates.title);
    if (updates.description !== undefined) {
      keyResult.updateDescription(updates.description || '');
    }
    if (updates.weight !== undefined) {
      Goal.validateKeyResultWeight(updates.weight);
      keyResult.updateWeight(updates.weight);
    }
    if (updates.targetValue !== undefined) {
      keyResult.updateTargetValue(updates.targetValue);
    }
    if (updates.unit !== undefined) {
      keyResult.updateUnit(updates.unit);
    }

    this._props.updatedAt = new Date();

    // 注：属性更新不触发专门的事件，由 Goal:update 处理
  }

  /**
   * ✅ 重新排序关键结果
   */
  public reorderKeyResults(keyResultIds: string[]): void {
    const newOrder: KeyResult[] = [];
    for (let i = 0; i < keyResultIds.length; i++) {
      const kr = this._props.keyResults.find((k) => k.id === keyResultIds[i]);
      if (kr) {
        kr.updateSortOrder(i);
        newOrder.push(kr);
      }
    }
    // 添加未在列表中的关键结果
    for (const kr of this._props.keyResults) {
      if (!newOrder.includes(kr)) {
        newOrder.push(kr);
      }
    }
    this._props.keyResults = newOrder;
    this._props.updatedAt = new Date();
  }

  /**
   * 📊 通过 ID 获取关键结果
   */
  public getKeyResult(id: string): KeyResult | null {
    return this._props.keyResults.find((kr) => kr.id === id) || null;
  }

  /**
   * 📊 获取所有关键结果
   */
  public getAllKeyResults(): KeyResult[] {
    return [...this._props.keyResults];
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
    
    const keyResult = this._props.keyResults.find((kr) => kr.id === keyResultId);
    if (!keyResult) {
      throw new GoalKeyResultNotFoundError(keyResultId);
    }

    const oldProgress = this.calculateProgress();
    keyResult.recalculateProgress(newValue);
    this._props.updatedAt = new Date();

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
    this.ensureModifiable();
    
    const index = this._props.keyResults.findIndex((kr) => kr.id === keyResultId);
    if (index !== -1) {
      const removed = this._props.keyResults.splice(index, 1)[0];
      this._props.updatedAt = new Date();

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
    if (this._props.keyResults.length === 0) return 0;

    // 计算总权重
    const totalWeight = this._props.keyResults.reduce((sum, kr) => sum + kr.weight, 0);

    // 如果总权重为 0，使用简单平均
    if (totalWeight === 0) {
      const totalPercentage = this._props.keyResults.reduce((sum, kr) => sum + kr.calculatePercentage(), 0);
      return Math.round((totalPercentage / this._props.keyResults.length) * 100) / 100;
    }

    // 加权平均计算
    const weightedSum = this._props.keyResults.reduce(
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
    const totalWeight = this._props.keyResults.reduce((sum, kr) => sum + kr.weight, 0);
    const totalProgress = this.calculateProgress();

    return {
      totalProgress,
      calculationMode: 'weighted_average' as const,
      krContributions: this._props.keyResults.map((kr) => {
        const krProgress = kr.calculatePercentage();
        const contribution =
          totalWeight > 0
            ? Math.round((krProgress * kr.weight) / totalWeight * 100) / 100
            : Math.round((krProgress / this._props.keyResults.length) * 100) / 100;

        return {
          keyResultId: kr.id as unknown as string,
          keyResultName: kr.title,
          progress: krProgress,
          weight: kr.weight,
          contribution,
        };
      }),
      lastUpdateTime: this._props.updatedAt.getTime(),
      updateTrigger: '自动计算',
    };
  }

  /**
   * 📊 检查是否所有关键结果都已完成
   */
  public areAllKeyResultsCompleted(): boolean {
    if (this._props.keyResults.length === 0) return false;
    return this._props.keyResults.every((kr) => kr.isCompleted());
  }

  // ================= 5. 权重快照管理 (Weight Snapshots) =================

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
    const kr = this._props.keyResults.find((k) => k.id === krId);
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

    this._props.weightSnapshots.push(snapshot);
    this._props.updatedAt = new Date();
  }

  /**
   * 📊 获取所有权重快照
   */
  public getAllWeightSnapshots(): ReadonlyArray<KeyResultWeightSnapshot> {
    return this._props.weightSnapshots;
  }

  /**
   * 📊 获取特定 KR 的权重快照
   */
  public getWeightSnapshotsByKeyResult(krId: string): ReadonlyArray<KeyResultWeightSnapshot> {
    return this._props.weightSnapshots.filter((snapshot) => snapshot.keyResultId === krId);
  }

  // ================= 6. 回顾管理 (Review Management) =================

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
    const keyResultSnapshots: KeyResultSnapshotDTO[] = this._props.keyResults.map((kr) => ({
      keyResultId: kr.id as any,
      title: kr.title,
      targetValue: kr.progress.targetValue,
      currentValue: kr.progress.currentValue,
      progressPercentage: kr.calculatePercentage(),
    }));

    const review = GoalReview.create({
      goalId: this.id,
      type: params.reviewType as any,
      rating: params.rating || 3,
      summary: params.content,
      achievements: params.achievements,
      challenges: params.challenges,
      improvements: params.nextActions,
      keyResultSnapshots,
    });
    
    // 添加到集合
    this._props.goalReviews.push(review);
    this._props.updatedAt = new Date();

    this.addDomainEvent<GoalEventMap['goal:review-add']>('goal:review-add', {
      reviewId: review.id,
    });

    return review;
  }

  /**
   * 📊 获取最新的回顾记录
   */
  public getLatestReview(): GoalReview | null {
    if (this._props.goalReviews.length === 0) return null;
    return this._props.goalReviews[this._props.goalReviews.length - 1];
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
    
    const review = this._props.goalReviews.find((r) => r.id === reviewId);
    if (!review) {
      throw new GoalReviewNotFoundError(reviewId);
    }

    if (params.rating !== undefined) review.updateRating(params.rating);
    if (params.summary) review.updateSummary(params.summary);
    if (params.achievements) review.addAchievement(params.achievements);
    if (params.challenges) review.addChallenge(params.challenges);
    if (params.improvements) review.addImprovement(params.improvements);

    this._props.updatedAt = new Date();
  }

  /**
   * ✅ 删除回顾
   * @throws {GoalDeletedError} 当目标已删除时
   */
  public removeReview(reviewId: string): GoalReview | null {
    this.ensureNotDeleted();
    
    const index = this._props.goalReviews.findIndex((r) => r.id === reviewId);
    if (index !== -1) {
      const removed = this._props.goalReviews.splice(index, 1)[0];
      this._props.updatedAt = new Date();
      return removed;
    }
    return null;
  }

  // ================= 7. 业务规则检查 (Business Rules) =================

  /**
   * 📊 是否已过期
   */
  public isOverdue(): boolean {
    if (!this._props.targetDate || this._props.status === GoalStatus.Completed) return false;
    return Date.now() > this._props.targetDate.getTime();
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
    if (!this._props.targetDate) return null;
    const diff = this._props.targetDate.getTime() - Date.now();
    return Math.ceil(diff / DAY_MS);
  }

  // ================= 8. 序列化 (Serialization) =================

  /**
   * 转换为 Server DTO
   */
  public toServerDTO(includeChildren: boolean = false): GoalServerDTO {
    const goalId = this.id as unknown as string;
    return {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      color: this._props.color,
      feasibilityAnalysis: this._props.feasibilityAnalysis,
      motivation: this._props.motivation,
      status: this._props.status,
      importance: this._props.importance,
      priority: this.priority,
      category: this._props.category,
      tags: [...this._props.tags],
      startDate: this._props.startDate?.getTime() ?? null,
      targetDate: this._props.targetDate?.getTime() ?? null,
      completedAt: this._props.completedAt?.getTime() ?? null,
      archivedAt: this._props.archivedAt?.getTime() ?? null,
      folderId: this._props.folderId as GoalFolderId | null,
      parentGoalId: this._props.parentGoalId,
      sortOrder: this._props.sortOrder,
      reminderConfig: this._props.reminderConfig?.toDTO() ?? null,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      keyResults: includeChildren && this._props.keyResults.length > 0
        ? this._props.keyResults.map((kr) => kr.toServerDTO())
        : null,
      weightSnapshots: includeChildren && this._props.weightSnapshots.length > 0
        ? this._props.weightSnapshots.map((ws) => ws.toDTO())
        : null,
      goalReviews: includeChildren && this._props.goalReviews.length > 0
        ? this._props.goalReviews.map((r) => r.toServerDTO())
        : null,
      version: 1, // Default version for optimistic locking
    };
  }

  /**
   * 转换为 Client DTO
   */
  public toClientDTO(includeChildren: boolean = false): import('@dailyuse/contracts/goal').GoalClientDTO {
    const now = new Date();
    const isOverdue = this._props.targetDate ? this._props.targetDate < now && this._props.status !== GoalStatus.Completed : false;
    const daysRemaining = this._props.targetDate
      ? Math.ceil((this._props.targetDate.getTime() - now.getTime()) / DAY_MS)
      : null;

    return {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      color: this._props.color,
      feasibilityAnalysis: this._props.feasibilityAnalysis,
      motivation: this._props.motivation,
      status: this._props.status,
      importance: this._props.importance,
      priority: this.priority,
      category: this._props.category,
      tags: [...this._props.tags],
      startDate: this._props.startDate?.getTime() ?? null,
      targetDate: this._props.targetDate?.getTime() ?? null,
      completedAt: this._props.completedAt?.getTime() ?? null,
      archivedAt: this._props.archivedAt?.getTime() ?? null,
      folderId: this._props.folderId as GoalFolderId | null,
      parentGoalId: this._props.parentGoalId,
      sortOrder: this._props.sortOrder,
      reminderConfig: this._props.reminderConfig?.toDTO() ?? null,
      version: 1,
      createdAt: this._props.createdAt.getTime(),
      updatedAt: this._props.updatedAt.getTime(),
      deletedAt: this._props.deletedAt?.getTime() ?? null,
      keyResults: includeChildren && this._props.keyResults.length > 0
        ? this._props.keyResults.map((kr) => kr.toClientDTO())
        : null,
      reviews: includeChildren && this._props.goalReviews.length > 0
        ? this._props.goalReviews.map((r) => r.toClientDTO())
        : null,
    };
  }

  /**
   * 转换为持久化 DTO
   */
  public toPersistenceDTO(): GoalPersistenceDTO {
    return {
      id: this.id,
      identityId: this._props.identityId,
      name: this._props.name,
      description: this._props.description,
      color: this._props.color,
      feasibilityAnalysis: this._props.feasibilityAnalysis,
      motivation: this._props.motivation,
      status: this._props.status,
      importance: this._props.importance,
      priority: this._props.priority,
      category: this._props.category,
      tags: [...this._props.tags],
      startDate: this._props.startDate,
      targetDate: this._props.targetDate,
      completedAt: this._props.completedAt,
      archivedAt: this._props.archivedAt,
      folderId: this._props.folderId as GoalFolderId | null,
      parentGoalId: this._props.parentGoalId,
      sortOrder: this._props.sortOrder,
      reminderConfig: this._props.reminderConfig?.toPersistenceDTO() ?? null,
      keyResults: this._props.keyResults.length > 0
        ? this._props.keyResults.map((kr): KeyResultPersistenceDTO => {
            const serverDto = kr.toServerDTO();
            return {
              id: serverDto.id,
              goalId: this.id,
              title: serverDto.title,
              description: serverDto.description,
              progress: JSON.stringify({
                initialValue: (serverDto.progress as any).initialValue,
                currentValue: serverDto.progress.currentValue,
                targetValue: serverDto.progress.targetValue,
                valueType: serverDto.progress.valueType,
                aggregationMethod: serverDto.progress.aggregationMethod,
                unit: serverDto.progress.unit,
              }),
              weight: serverDto.weight,
              sortOrder: serverDto.sortOrder,
              version: serverDto.version,
              createdAt: new Date(serverDto.createdAt),
              updatedAt: new Date(serverDto.updatedAt),
              deletedAt: serverDto.deletedAt ? new Date(serverDto.deletedAt) : null,
            };
          })
        : null,
      goalReviews: this._props.goalReviews.length > 0
        ? this._props.goalReviews.map((r) => r.toPersistenceDTO())
        : null,
      weightSnapshots: this._props.weightSnapshots.length > 0
        ? this._props.weightSnapshots.map((ws) => ws.toDTO())
        : null,
      createdAt: this._props.createdAt,
      updatedAt: this._props.updatedAt,
      deletedAt: this._props.deletedAt,
      version: 1,
    };
  }

  // ================= 9. Guard Clauses (守卫方法) =================

  /**
   * 确保目标未被归档
   * @throws {GoalArchivedError} 当目标已被归档时
   */
  private ensureNotArchived(): void {
    if (this._props.archivedAt !== null || this._props.status === GoalStatus.Archived) {
      throw new GoalArchivedError(this.id);
    }
  }

  /**
   * 确保目标可以被修改（未归档）
   * @throws {GoalArchivedError} 当目标已被归档时
   */
  private ensureModifiable(): void {
    this.ensureNotArchived();
  }

  // ================= 10. 静态验证方法 (Static Validators) =================

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
   */
  public static validateParentGoal(parentGoal?: Goal): void {
    if (!parentGoal) return;
    
    if (parentGoal.status === GoalStatus.Archived || parentGoal.archivedAt !== null) {
      throw new GoalArchivedError(parentGoal.id);
    }
  }

  // ================= 11. 辅助方法 (Helpers) =================

  private resolveTimeRange(): { start: number | null; end: number | null } {
    const start = this._props.startDate?.getTime() ?? this._props.createdAt?.getTime() ?? null;
    let end = this._props.targetDate?.getTime() ?? this._props.completedAt?.getTime() ?? this._props.updatedAt?.getTime() ?? null;

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
