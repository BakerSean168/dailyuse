/**
 * Goal Aggregate Root - Client Interface
 * 目标聚合根 - 客户端接口
 */
import type { ImportanceLevel } from '../../../shared/index';
import type { GoalStatus } from '../enums';
import type { GoalServerDTO } from './GoalServer';
import type { KeyResultClient, KeyResultClientDTO } from '../entities/KeyResultClient';
import type { GoalReviewClient, GoalReviewClientDTO } from '../entities/GoalReviewClient';
import type { GoalReminderConfigClient, GoalReminderConfigClientDTO } from '../value-objects';
import type { GoalRecordClientDTO } from '../entities/GoalRecordClient';

// ============ DTO 定义 ============

export interface GoalTimeRangeSummary {
  startDate?: Date | null;
  targetDate?: number | null;
  actualStartDate?: number | null;
  actualEndDate?: number | null;
  durationDays?: number | null;
  elapsedDays?: number | null;
  remainingDays?: number | null;
}

/**
 * Goal Client DTO
 */
export interface GoalClientDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  color?: string | null; // 主题色（hex 格式，如 #FF5733）
  feasibilityAnalysis?: string | null; // 可行性分析
  motivation?: string | null; // 实现动机
  status: GoalStatus;
  importance: ImportanceLevel;
  // urgency: UrgencyLevel; // REMOVED
  category?: string | null;
  tags: string[];
  startDate?: number | null;
  targetDate?: number | null;
  completedAt?: number | null;
  archivedAt?: number | null;
  folderUuid?: string | null;
  parentGoalUuid?: string | null;
  sortOrder: number;
  reminderConfig?: GoalReminderConfigClientDTO | null;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;

  // ===== 子实体 DTO =====
  keyResults?: KeyResultClientDTO[] | null;
  reviews?: GoalReviewClientDTO[] | null;
}

// ============ 实体接口 ============

/**
 * Goal 聚合根 - Client 接口（实例方法）
 */
export interface GoalClient {
  // 基础属性
  uuid: string;
  accountUuid: string;
  title: string;
  description?: string | null;
  color?: string | null; // 主题色
  feasibilityAnalysis?: string | null; // 可行性分析
  motivation?: string | null; // 实现动机
  status: GoalStatus;
  importance: ImportanceLevel;
  // urgency: UrgencyLevel; // REMOVED
  category?: string | null;
  tags: string[];
  startDate?: Date | null;
  targetDate?: number | null;
  completedAt?: Date | null;
  archivedAt?: number | null;
  folderUuid?: string | null;
  parentGoalUuid?: string | null;
  sortOrder: number;
  reminderConfig?: GoalReminderConfigClient | null;

  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // ===== 子实体集合（聚合根统一管理） =====

  /**
   * 关键结果列表（懒加载，可选）
   * 通过聚合根统一访问和管理子实体
   */
  keyResults?: KeyResultClient[] | null;

  /**
   * 复盘记录列表（懒加载，可选）
   */
  reviews?: GoalReviewClient[] | null;

  // ===== 工厂方法（创建子实体 - 实例方法） =====

  /**
   * 创建子实体：KeyResult（通过聚合根创建）
   * @param params 关键结果创建参数
   * @returns 新的 KeyResult 实例
   */
  createKeyResult(params: {
    title: string;
    description?: string;
    valueType: string;
    targetValue: number;
    unit?: string;
    weight: number;
  }): KeyResultClient;

  /**
   * 创建子实体：GoalReview（通过聚合根创建）
   * @param params 复盘创建参数
   * @returns 新的 GoalReview 实例
   */
  createReview(params: {
    title: string;
    content: string;
    reviewType: string;
    rating?: number;
    achievements?: string;
    challenges?: string;
    nextActions?: string;
  }): GoalReviewClient;

  // ===== 子实体管理方法 =====

  /**
   * 添加关键结果到聚合根
   */
  addKeyResult(keyResult: KeyResultClient): void;

  /**
   * 从聚合根移除关键结果
   */
  removeKeyResult(keyResultUuid: string): KeyResultClient | null;

  /**
   * 更新关键结果
   */
  updateKeyResult(keyResultUuid: string, updates: Partial<KeyResultClient>): void;

  /**
   * 重新排序关键结果
   */
  reorderKeyResults(keyResultUuids: string[]): void;

  /**
   * 通过 UUID 获取关键结果
   */
  getKeyResult(uuid: string): KeyResultClient | null;

  /**
   * 获取所有关键结果
   */
  getAllKeyResults(): KeyResultClient[];

  /**
   * 添加复盘记录
   */
  addReview(review: GoalReviewClient): void;

  /**
   * 从聚合根移除复盘
   */
  removeReview(reviewUuid: string): GoalReviewClient | null;

  /**
   * 获取所有复盘记录
   */
  getReviews(): GoalReviewClient[];

  /**
   * 获取最新的复盘记录
   */
  getLatestReview(): GoalReviewClient | null;

  // ===== UI 业务方法 =====

  /**
   * 获取显示标题
   */
  getDisplayTitle(): string;

  /**
   * 获取状态徽章
   */
  getStatusBadge(): { text: string; color: string };

  /**
   * 获取优先级徽章
   */
  getPriorityBadge(): { text: string; color: string };

  /**
   * 获取进度文本
   */
  getProgressText(): string;

  /**
   * 获取日期范围文本
   */
  getDateRangeText(): string;

  /**
   * 获取提醒状态文本
   */
  getReminderStatusText(): string;

  /**
   * 获取提醒图标
   */
  getReminderIcon(): string;

  /**
   * 是否应该显示提醒徽章
   */
  shouldShowReminderBadge(): boolean;

  /**
   * 获取时间范围摘要
   */
  getTimeRangeSummary(): GoalTimeRangeSummary | null;

  /**
   * 获取所有记录
   */
  getRecords(): GoalRecordClientDTO[] | null;

  /**
   * 获取记录数量
   */
  getRecordCount(): number;

  // ===== 操作判断方法 =====

  /**
   * 是否可以激活
   */
  canActivate(): boolean;

  /**
   * 是否可以完成
   */
  canComplete(): boolean;

  /**
   * 是否可以归档
   */
  canArchive(): boolean;

  /**
   * 是否可以删除
   */
  canDelete(): boolean;

  /**
   * 是否可以添加关键结果
   */
  canAddKeyResult(): boolean;

  /**
   * 是否可以添加复盘
   */
  canAddReview(): boolean;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toServerDTO(includeChildren?: boolean): GoalServerDTO;

  /**
   * 转换为 Client DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toClientDTO(includeChildren?: boolean): GoalClientDTO;
}

/**
 * Goal 静态工厂方法接口
 * 注意：TypeScript 接口不能包含静态方法，这些方法应该在类上实现
 */
export interface GoalClientStatic {
  /**
   * 创建新的 Goal 聚合根（静态工厂方法）
   * @param params 创建参数
   * @returns 新的 Goal 实例
   */
  create(params: {
    accountUuid: string;
    title: string;
    description?: string;
    importance: ImportanceLevel;
    // urgency: UrgencyLevel; // REMOVED
    category?: string;
    tags?: string[];
    startDate?: Date;
    targetDate?: number;
    folderUuid?: string;
    parentGoalUuid?: string;
  }): GoalClient;

  /**
   * 创建用于创建表单的空 Goal 实例
   */
  forCreate(accountUuid: string): GoalClient;

  /**
   * 从 Server DTO 创建实体（递归创建子实体）
   */
  fromServerDTO(dto: GoalServerDTO): GoalClient;

  /**
   * 从 Client DTO 创建实体（递归创建子实体）
   */
  fromClientDTO(dto: GoalClientDTO): GoalClient;
}

/**
 * Goal 实例方法接口（扩展，包含 clone）
 */
export interface GoalClientInstance extends GoalClient {
  /**
   * 克隆当前实体（用于编辑表单）
   */
  clone(): GoalClient;
}
