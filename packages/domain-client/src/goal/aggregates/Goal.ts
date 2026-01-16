/**
 * Goal 聚合根实现 (Client)
 */

import {
  GoalStatus,
} from '@dailyuse/contracts/goal';
import type {
  GoalClient,
  GoalClientDTO,
  GoalRecordClientDTO,
  GoalServerDTO,
  GoalTimeRangeSummary,
} from '@dailyuse/contracts/goal';
import { ImportanceLevel } from '@dailyuse/contracts/shared';
import { AggregateRoot } from '@dailyuse/utils';
import { GoalReminderConfig } from '../value-objects';
import { KeyResult, GoalReview } from '../entities';

// Priority calculation constants (aligned with domain-server)
const IMPORTANCE_WEIGHT = 0.6;
const TIME_WEIGHT = 0.4;
const OVERDUE_BOOST = 50;

const DAY_MS = 1000 * 60 * 60 * 24;
const DEFAULT_DURATION = 30 * DAY_MS;

export class Goal extends AggregateRoot implements GoalClient {
  private _accountUuid: string;
  private _title: string;
  private _description?: string | null;
  private _color?: string | null; // 主题色
  private _feasibilityAnalysis?: string | null; // 可行性分析
  private _motivation?: string | null; // 实现动机
  private _status: GoalStatus;
  private _importance: ImportanceLevel;
  private _category?: string | null;
  private _tags: string[];
  private _startDate?: number | null;
  private _targetDate?: number | null;
  private _completedAt?: number | null;
  private _archivedAt?: number | null;
  private _folderUuid?: string | null;
  private _parentGoalUuid?: string | null;
  private _sortOrder: number;
  private _reminderConfig?: GoalReminderConfig | null;
  private _createdAt: number;
  private _updatedAt: number;
  private _deletedAt?: number | null;

  // 子实体集合
  private _keyResults: KeyResult[];
  private _reviews: GoalReview[];

  private constructor(params: {
    uuid?: string;
    accountUuid: string;
    title: string;
    description?: string | null;
    color?: string | null;
    feasibilityAnalysis?: string | null;
    motivation?: string | null;
    status: GoalStatus;
    importance: ImportanceLevel;
    category?: string | null;
    tags?: string[];
    startDate?: number | null;
    targetDate?: number | null;
    completedAt?: number | null;
    archivedAt?: number | null;
    folderUuid?: string | null;
    parentGoalUuid?: string | null;
    sortOrder?: number;
    reminderConfig?: GoalReminderConfig | null;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number | null;
    keyResults?: KeyResult[];
    reviews?: GoalReview[];
  }) {
    super(params.uuid || AggregateRoot.generateUUID());
    this._accountUuid = params.accountUuid;
    this._title = params.title;
    this._description = params.description;
    this._color = params.color;
    this._feasibilityAnalysis = params.feasibilityAnalysis;
    this._motivation = params.motivation;
    this._status = params.status;
    this._importance = params.importance;
    this._category = params.category;
    this._tags = params.tags ?? [];
    this._startDate = params.startDate;
    this._targetDate = params.targetDate;
    this._completedAt = params.completedAt;
    this._archivedAt = params.archivedAt;
    this._folderUuid = params.folderUuid;
    this._parentGoalUuid = params.parentGoalUuid;
    this._sortOrder = params.sortOrder ?? 0;
    this._reminderConfig = params.reminderConfig;
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._deletedAt = params.deletedAt;
    this._keyResults = params.keyResults ?? [];
    this._reviews = params.reviews ?? [];
  }

  // Getters - 基础属性
  public override get uuid(): string {
    return this._uuid;
  }
  public get accountUuid(): string {
    return this._accountUuid;
  }
  public get title(): string {
    return this._title;
  }
  public get description(): string | null | undefined {
    return this._description;
  }
  public get color(): string | null | undefined {
    return this._color;
  }
  public get feasibilityAnalysis(): string | null | undefined {
    return this._feasibilityAnalysis;
  }
  public get motivation(): string | null | undefined {
    return this._motivation;
  }
  public get status(): GoalStatus {
    return this._status;
  }
  public get importance(): ImportanceLevel {
    return this._importance;
  }
  public get category(): string | null | undefined {
    return this._category;
  }
  public get tags(): string[] {
    return [...this._tags];
  }
  public get startDate(): number | null | undefined {
    return this._startDate;
  }
  public get targetDate(): number | null | undefined {
    return this._targetDate;
  }
  public get completedAt(): number | null | undefined {
    return this._completedAt;
  }
  public get archivedAt(): number | null | undefined {
    return this._archivedAt;
  }
  public get folderUuid(): string | null | undefined {
    return this._folderUuid;
  }
  public get parentGoalUuid(): string | null | undefined {
    return this._parentGoalUuid;
  }
  public get sortOrder(): number {
    return this._sortOrder;
  }
  public get reminderConfig(): GoalReminderConfig | null | undefined {
    return this._reminderConfig;
  }
  public get createdAt(): number {
    return this._createdAt;
  }
  public get updatedAt(): number {
    return this._updatedAt;
  }
  public get deletedAt(): number | null | undefined {
    return this._deletedAt;
  }

  // 子实体访问
  public get keyResults(): KeyResult[] | null {
    return this._keyResults.length > 0 ? [...this._keyResults] : null;
  }
  public get reviews(): GoalReview[] | null {
    return this._reviews.length > 0 ? [...this._reviews] : null;
  }

  // UI 计算属性
  public get overallProgress(): number {
    if (this._keyResults.length === 0) return 0;
    const total = this._keyResults.reduce((sum, kr) => sum + kr.progressPercentage, 0);
    return Math.round(total / this._keyResults.length);
  }

  public get isDeleted(): boolean {
    return !!this._deletedAt;
  }

  public get isCompleted(): boolean {
    return this._status === GoalStatus.COMPLETED;
  }

  public get isArchived(): boolean {
    return this._status === GoalStatus.ARCHIVED;
  }

  public get isOverdue(): boolean {
    if (!this._targetDate || this.isCompleted) return false;
    return Date.now() > this._targetDate;
  }

  public get daysRemaining(): number | null {
    if (!this._targetDate || this.isCompleted) return null;
    const days = Math.ceil((this._targetDate - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  }

  public get statusText(): string {
    const statusLabels: Record<GoalStatus, string> = {
      [GoalStatus.DRAFT]: '草稿',
      [GoalStatus.ACTIVE]: '进行中',
      [GoalStatus.COMPLETED]: '已完成',
      [GoalStatus.ARCHIVED]: '已归档',
    };
    return statusLabels[this._status];
  }

  public get importanceText(): string {
    return this._importance || '未知';
  }

  /**
   * 计算动态优先级 (0-100)
   * 基于 importance 和 targetDate
   */
  private calculatePriority(): number {
    const importanceMap: Record<ImportanceLevel, number> = {
      [ImportanceLevel.Vital]: 5,
      [ImportanceLevel.Important]: 4,
      [ImportanceLevel.Moderate]: 3,
      [ImportanceLevel.Minor]: 2,
      [ImportanceLevel.Trivial]: 1,
    };
    const importanceValue = importanceMap[this._importance] ?? 3;
    const importanceWeight = importanceValue * 20 * IMPORTANCE_WEIGHT;

    if (!this._targetDate) {
      return Math.round(importanceWeight + 5);
    }

    const now = Date.now();
    const daysRemaining = Math.ceil((this._targetDate - now) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return Math.min(100, Math.round(importanceWeight + OVERDUE_BOOST));
    }

    const timeUrgency = Math.min(100, 100 / (1 + daysRemaining / 7));
    const timeWeight = timeUrgency * TIME_WEIGHT;

    return Math.min(100, Math.max(0, Math.round(importanceWeight + timeWeight)));
  }

  /**
   * 动态优先级值 (0-100)
   */
  public get priority(): number {
    return this.calculatePriority();
  }

  /**
   * 优先级级别
   */
  public get priorityLevel(): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const p = this.priority;
    if (p >= 80) return 'CRITICAL';
    if (p >= 60) return 'HIGH';
    if (p >= 40) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * 优先级文本
   */
  public get priorityText(): string {
    const levelMap = { CRITICAL: '紧急', HIGH: '高', MEDIUM: '中', LOW: '低' };
    return levelMap[this.priorityLevel];
  }

  /**
   * 优先级分数 (使用 priority 值)
   */
  public get priorityScore(): number {
    return this.priority;
  }

  public get keyResultCount(): number {
    return this._keyResults.length;
  }

  public get completedKeyResultCount(): number {
    return this._keyResults.filter((kr) => kr.isCompleted).length;
  }

  public get reviewCount(): number {
    return this._reviews.length;
  }

  public get hasActiveReminders(): boolean {
    return !!this._reminderConfig?.hasActiveTriggers();
  }

  public get reminderSummary(): string | null {
    return this._reminderConfig?.triggerSummary ?? null;
  }

  public get weightedProgress(): number {
    return this.overallProgress;
  }

  public get timeProgressRatio(): number | null {
    return this.calculateTimeProgressRatio();
  }

  public get timeProgressPercentage(): number | null {
    const ratio = this.timeProgressRatio;
    if (ratio === null) return null;
    return Math.round(ratio * 10000) / 100;
  }

  public get timeProgressText(): string | null {
    const percentage = this.timeProgressPercentage;
    if (percentage === null) return null;
    return `${percentage.toFixed(1)}%`;
  }

  public get timeRangeSummary(): GoalTimeRangeSummary | null {
    return this.buildTimeRangeSummary();
  }

  public get records(): GoalRecordClientDTO[] | null {
    if (!this._keyResults.length) return null;
    const aggregated = this._keyResults.reduce<GoalRecordClientDTO[]>((acc, kr) => {
      const recordList = kr.records ?? [];
      if (recordList && recordList.length) {
        return acc.concat(recordList);
      }
      return acc;
    }, []);
    return aggregated.length ? aggregated : null;
  }

  public get recordCount(): number {
    return this.records?.length ?? 0;
  }

  public getTimeRangeSummary(): GoalTimeRangeSummary | null {
    const summary = this.timeRangeSummary;
    if (!summary) return null;
    return { ...summary };
  }

  public getRecords(): GoalRecordClientDTO[] | null {
    const data = this.records;
    return data ? [...data] : null;
  }

  public getRecordCount(): number {
    return this.recordCount;
  }

  /**
   * 分析信息（兼容前端 UI 使用的属性结构）
   * 将 motivation 和 feasibilityAnalysis 映射为 analysis 对象
   */
  public get analysis(): { motive?: string; feasibility?: string } {
    return {
      motive: this._motivation || undefined,
      feasibility: this._feasibilityAnalysis || undefined,
    };
  }

  // 子实体工厂方法
  public createKeyResult(params: {
    title: string;
    description?: string;
    valueType: string;
    targetValue: number;
    unit?: string;
    weight: number;
  }): KeyResult {
    const keyResult = KeyResult.forCreate(this._uuid);
    // 这里应该设置参数，但由于 forCreate 返回的是预设的实例
    // 在实际使用中需要支持参数传递或在创建后更新
    return keyResult;
  }

  public createReview(params: {
    title: string;
    content: string;
    reviewType: string;
    rating?: number;
    achievements?: string;
    challenges?: string;
    nextActions?: string;
  }): GoalReview {
    const review = GoalReview.forCreate(this._uuid);
    return review;
  }

  // 子实体管理方法
  public addKeyResult(keyResult: KeyResult): void {
    if (!(keyResult instanceof KeyResult)) {
      throw new Error('keyResult must be an instance of KeyResult');
    }
    this._keyResults.push(keyResult);
    this._updatedAt = Date.now();
  }

  public removeKeyResult(keyResultUuid: string): KeyResult | null {
    const index = this._keyResults.findIndex((kr) => kr.uuid === keyResultUuid);
    if (index === -1) return null;
    const removed = this._keyResults.splice(index, 1)[0];
    this._updatedAt = Date.now();
    return removed;
  }

  public updateKeyResult(
    keyResultUuid: string,
    updates: Partial<KeyResult>,
  ): void {
    const index = this._keyResults.findIndex((kr) => kr.uuid === keyResultUuid);
    if (index === -1) throw new Error('KeyResult not found');
    // 由于 KeyResult 是不可变的，需要重新创建
    const current = this._keyResults[index];
    const dto = current.toClientDTO();
    const updated = KeyResult.fromClientDTO({ ...dto, ...updates });
    this._keyResults[index] = updated;
    this._updatedAt = Date.now();
  }

  public reorderKeyResults(keyResultUuids: string[]): void {
    const reordered = keyResultUuids
      .map((uuid) => this._keyResults.find((kr) => kr.uuid === uuid))
      .filter((kr): kr is KeyResult => !!kr);
    this._keyResults = reordered;
    this._updatedAt = Date.now();
  }

  public getKeyResult(uuid: string): KeyResult | null {
    return this._keyResults.find((kr) => kr.uuid === uuid) ?? null;
  }

  public getAllKeyResults(): KeyResult[] {
    return [...this._keyResults];
  }

  // 属性修改方法
  public updateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }
    this._title = title.trim();
    this._updatedAt = Date.now();
  }

  public updateDescription(description: string | null): void {
    this._description = description;
    this._updatedAt = Date.now();
  }

  public updateColor(color: string | null): void {
    this._color = color;
    this._updatedAt = Date.now();
  }

  public updateMotivation(motivation: string | null): void {
    this._motivation = motivation;
    this._updatedAt = Date.now();
  }

  public updateFeasibilityAnalysis(feasibilityAnalysis: string | null): void {
    this._feasibilityAnalysis = feasibilityAnalysis;
    this._updatedAt = Date.now();
  }

  public updateImportance(importance: ImportanceLevel): void {
    this._importance = importance;
    this._updatedAt = Date.now();
  }

  public updateCategory(category: string | null): void {
    this._category = category;
    this._updatedAt = Date.now();
  }

  public updateTags(tags: string[]): void {
    this._tags = [...tags];
    this._updatedAt = Date.now();
  }

  public updateTimeRange(startDate: number | null, targetDate: number | null): void {
    if (startDate && targetDate && startDate > targetDate) {
      throw new Error('Start date cannot be after target date');
    }
    this._startDate = startDate;
    this._targetDate = targetDate;
    this._updatedAt = Date.now();
  }

  public updateStartDate(startDate: number | null): void {
    if (startDate && this._targetDate && startDate > this._targetDate) {
      throw new Error('Start date cannot be after target date');
    }
    this._startDate = startDate;
    this._updatedAt = Date.now();
  }

  public updateTargetDate(targetDate: number | null): void {
    if (this._startDate && targetDate && this._startDate > targetDate) {
      throw new Error('Target date cannot be before start date');
    }
    this._targetDate = targetDate;
    this._updatedAt = Date.now();
  }

  public updateFolder(folderUuid: string | null): void {
    this._folderUuid = folderUuid;
    this._updatedAt = Date.now();
  }

  public updateParentGoal(parentGoalUuid: string | null): void {
    this._parentGoalUuid = parentGoalUuid;
    this._updatedAt = Date.now();
  }

  public updateSortOrder(sortOrder: number): void {
    this._sortOrder = sortOrder;
    this._updatedAt = Date.now();
  }

  public updateReminderConfig(reminderConfig: GoalReminderConfig | null): void {
    this._reminderConfig = reminderConfig;
    this._updatedAt = Date.now();
  }

  /**
   * 设置 accountUuid（用于保存前注入）
   * 仅在新建目标保存时调用
   */
  public setAccountUuid(accountUuid: string): void {
    if (this._accountUuid && this._accountUuid !== '') {
      throw new Error('AccountUuid is already set');
    }
    this._accountUuid = accountUuid;
  }

  // 状态变更方法
  public activate(): void {
    if (!this.canActivate()) {
      throw new Error('Goal cannot be activated in current status');
    }
    this._status = GoalStatus.ACTIVE;
    this._updatedAt = Date.now();
  }

  public complete(): void {
    if (!this.canComplete()) {
      throw new Error('Goal cannot be completed in current status');
    }
    this._status = GoalStatus.COMPLETED;
    this._completedAt = Date.now();
    this._updatedAt = Date.now();
  }

  public archive(): void {
    if (!this.canArchive()) {
      throw new Error('Goal cannot be archived in current status');
    }
    this._status = GoalStatus.ARCHIVED;
    this._archivedAt = Date.now();
    this._updatedAt = Date.now();
  }

  public reopen(): void {
    if (this._status !== GoalStatus.COMPLETED && this._status !== GoalStatus.ARCHIVED) {
      throw new Error('Only completed or archived goals can be reopened');
    }
    this._status = GoalStatus.ACTIVE;
    this._completedAt = null;
    this._archivedAt = null;
    this._updatedAt = Date.now();
  }

  public addReview(review: GoalReview): void {
    if (!(review instanceof GoalReview)) {
      throw new Error('review must be an instance of GoalReview');
    }
    this._reviews.push(review);
    this._updatedAt = Date.now();
  }

  public removeReview(reviewUuid: string): GoalReview | null {
    const index = this._reviews.findIndex((r) => r.uuid === reviewUuid);
    if (index === -1) return null;
    const removed = this._reviews.splice(index, 1)[0];
    this._updatedAt = Date.now();
    return removed;
  }

  public getReviews(): GoalReview[] {
    return [...this._reviews];
  }

  public getLatestReview(): GoalReview | null {
    if (this._reviews.length === 0) return null;
    return this._reviews.sort((a, b) => b.reviewedAt - a.reviewedAt)[0];
  }

  // UI 业务方法
  public getDisplayTitle(): string {
    const maxLength = 50;
    if (this._title.length <= maxLength) return this._title;
    return `${this._title.substring(0, maxLength)}...`;
  }

  public getStatusBadge(): { text: string; color: string } {
    const badges: Record<GoalStatus, { text: string; color: string }> = {
      [GoalStatus.DRAFT]: { text: '草稿', color: 'gray' },
      [GoalStatus.ACTIVE]: { text: '进行中', color: 'blue' },
      [GoalStatus.COMPLETED]: { text: '已完成', color: 'green' },
      [GoalStatus.ARCHIVED]: { text: '已归档', color: 'amber' },
    };
    return badges[this._status];
  }

  public getPriorityBadge(): { text: string; color: string } {
    const level = this.priorityLevel;
    const badges: Record<string, { text: string; color: string }> = {
      CRITICAL: { text: '紧急', color: 'red' },
      HIGH: { text: '高优先级', color: 'orange' },
      MEDIUM: { text: '中优先级', color: 'amber' },
      LOW: { text: '低优先级', color: 'blue' },
    };
    return badges[level];
  }

  public getProgressText(): string {
    const completed = this.completedKeyResultCount;
    const total = this.keyResultCount;
    const percentage = this.overallProgress;
    return `${completed}/${total} (${percentage}%)`;
  }

  public getDateRangeText(): string {
    if (!this._startDate && !this._targetDate) return '未设置时间';
    const start = this._startDate
      ? new Date(this._startDate).toLocaleDateString('zh-CN')
      : '未设置';
    const target = this._targetDate
      ? new Date(this._targetDate).toLocaleDateString('zh-CN')
      : '未设置';
    return `${start} 至 ${target}`;
  }

  public getReminderStatusText(): string {
    if (!this._reminderConfig) return '未设置提醒';
    return this._reminderConfig.statusText;
  }

  public getReminderIcon(): string {
    if (!this.hasActiveReminders) return '🔕';
    return '🔔';
  }

  public shouldShowReminderBadge(): boolean {
    return this.hasActiveReminders;
  }

  // 操作判断方法
  public canActivate(): boolean {
    return this._status === GoalStatus.DRAFT;
  }

  public canComplete(): boolean {
    return this._status === GoalStatus.ACTIVE;
  }

  public canArchive(): boolean {
    return this._status === GoalStatus.COMPLETED;
  }

  public canDelete(): boolean {
    return !this.isDeleted;
  }

  public canAddKeyResult(): boolean {
    return this._status === GoalStatus.DRAFT || this._status === GoalStatus.ACTIVE;
  }

  public canAddReview(): boolean {
    return true;
  }

  // DTO 转换
  public toServerDTO(includeChildren = false): GoalServerDTO {
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      status: this._status,
      importance: this._importance,
      category: this._category,
      tags: [...this._tags],
      startDate: this._startDate,
      targetDate: this._targetDate,
      completedAt: this._completedAt,
      archivedAt: this._archivedAt,
      folderUuid: this._folderUuid,
      parentGoalUuid: this._parentGoalUuid,
      sortOrder: this._sortOrder,
      reminderConfig: this._reminderConfig?.toServerDTO(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      keyResults: includeChildren ? this._keyResults.map((kr) => kr.toServerDTO()) : undefined,
      reviews: includeChildren ? this._reviews.map((r) => r.toServerDTO()) : undefined,
    };
  }

  public toClientDTO(includeChildren = false): GoalClientDTO {
    const recordsPayload = includeChildren ? this.records : undefined;
    return {
      uuid: this._uuid,
      accountUuid: this._accountUuid,
      title: this._title,
      description: this._description,
      color: this._color,
      feasibilityAnalysis: this._feasibilityAnalysis,
      motivation: this._motivation,
      status: this._status,
      importance: this._importance,
      category: this._category,
      tags: [...this._tags],
      startDate: this._startDate,
      targetDate: this._targetDate,
      completedAt: this._completedAt,
      archivedAt: this._archivedAt,
      folderUuid: this._folderUuid,
      parentGoalUuid: this._parentGoalUuid,
      sortOrder: this._sortOrder,
      reminderConfig: this._reminderConfig?.toClientDTO(),
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      deletedAt: this._deletedAt,
      keyResults: includeChildren ? this._keyResults.map((kr) => kr.toClientDTO()) : undefined,
      reviews: includeChildren ? this._reviews.map((r) => r.toClientDTO()) : undefined,
      overallProgress: this.overallProgress,
      isDeleted: this.isDeleted,
      isCompleted: this.isCompleted,
      isArchived: this.isArchived,
      isOverdue: this.isOverdue,
      daysRemaining: this.daysRemaining,
      statusText: this.statusText,
      importanceText: this.importanceText,
      priority: this.priority,
      priorityLevel: this.priorityLevel,
      priorityText: this.priorityText,
      keyResultCount: this.keyResultCount,
      completedKeyResultCount: this.completedKeyResultCount,
      reviewCount: this.reviewCount,
      hasActiveReminders: this.hasActiveReminders,
      reminderSummary: this.reminderSummary,
      weightedProgress: this.weightedProgress,
      timeProgressRatio: this.timeProgressRatio,
      timeProgressPercentage: this.timeProgressPercentage,
      timeProgressText: this.timeProgressText,
      timeRangeSummary: this.timeRangeSummary,
      records: recordsPayload,
      recordCount: this.recordCount,
    };
  }

  // 静态工厂方法
  public static create(params: {
    accountUuid: string;
    title: string;
    description?: string;
    importance: ImportanceLevel;
    category?: string;
    tags?: string[];
    startDate?: number;
    targetDate?: number;
    folderUuid?: string;
    parentGoalUuid?: string;
  }): Goal {
    const now = Date.now();
    return new Goal({
      uuid: crypto.randomUUID(),
      accountUuid: params.accountUuid,
      title: params.title,
      description: params.description,
      status: GoalStatus.DRAFT,
      importance: params.importance,
      category: params.category,
      tags: params.tags,
      startDate: params.startDate,
      targetDate: params.targetDate,
      folderUuid: params.folderUuid,
      parentGoalUuid: params.parentGoalUuid,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * 创建新目标（用于前端表单）
   * accountUuid 会在保存时注入
   */
  public static forCreate(): Goal {
    const now = Date.now();
    return new Goal({
      uuid: crypto.randomUUID(), // 前端生成 UUID（乐观更新）
      accountUuid: '', // 占位符，保存时会被替换
      title: '',
      status: GoalStatus.DRAFT,
      importance: ImportanceLevel.Moderate,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromServerDTO(dto: GoalServerDTO): Goal {
    return new Goal({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      color: dto.color,
      feasibilityAnalysis: dto.feasibilityAnalysis,
      motivation: dto.motivation,
      status: dto.status,
      importance: dto.importance,
      category: dto.category,
      tags: dto.tags,
      startDate: dto.startDate,
      targetDate: dto.targetDate,
      completedAt: dto.completedAt,
      archivedAt: dto.archivedAt,
      folderUuid: dto.folderUuid,
      parentGoalUuid: dto.parentGoalUuid,
      sortOrder: dto.sortOrder,
      reminderConfig: dto.reminderConfig
        ? GoalReminderConfig.fromServerDTO(dto.reminderConfig)
        : null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
      keyResults: dto.keyResults?.map((kr) => KeyResult.fromServerDTO(kr)),
      reviews: dto.reviews?.map((r) => GoalReview.fromServerDTO(r)),
    });
  }

  public static fromClientDTO(dto: GoalClientDTO): Goal {
    return new Goal({
      uuid: dto.uuid,
      accountUuid: dto.accountUuid,
      title: dto.title,
      description: dto.description,
      color: dto.color,
      feasibilityAnalysis: dto.feasibilityAnalysis,
      motivation: dto.motivation,
      status: dto.status,
      importance: dto.importance,
      category: dto.category,
      tags: dto.tags,
      startDate: dto.startDate,
      targetDate: dto.targetDate,
      completedAt: dto.completedAt,
      archivedAt: dto.archivedAt,
      folderUuid: dto.folderUuid,
      parentGoalUuid: dto.parentGoalUuid,
      sortOrder: dto.sortOrder,
      reminderConfig: dto.reminderConfig
        ? GoalReminderConfig.fromClientDTO(dto.reminderConfig)
        : null,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
      deletedAt: dto.deletedAt,
      keyResults: dto.keyResults?.map((kr) => KeyResult.fromClientDTO(kr)),
      reviews: dto.reviews?.map((r) => GoalReview.fromClientDTO(r)),
    });
  }

  public clone(): Goal {
    return Goal.fromClientDTO(this.toClientDTO(true));
  }

  private resolveTimeRange(): { start: number | null; end: number | null } {
    const start = this._startDate ?? this._createdAt ?? null;
    let end = this._targetDate ?? this._completedAt ?? this._updatedAt ?? null;

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

  private buildTimeRangeSummary(): GoalTimeRangeSummary | null {
    const { start, end } = this.resolveTimeRange();
    if (!start && !end) return null;

    const now = Date.now();
    const duration = start && end ? Math.ceil((end - start) / DAY_MS) : null;
    const elapsed = start ? Math.max(0, Math.ceil((now - start) / DAY_MS)) : null;
    const remaining = end ? Math.ceil((end - now) / DAY_MS) : null;

    return {
      startDate: this._startDate ?? null,
      targetDate: this._targetDate ?? null,
      actualStartDate: start,
      actualEndDate: end,
      durationDays: duration,
      elapsedDays: elapsed,
      remainingDays: remaining,
    };
  }
}
