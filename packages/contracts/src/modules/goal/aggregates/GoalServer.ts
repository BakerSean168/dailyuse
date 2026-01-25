/**
 * Goal Aggregate Root - Server Interface
 * 目标聚合根 - 服务端接口
 */
import type { ImportanceLevel } from '../../../shared/index';
import type { GoalStatus } from '../enums';
import type { KeyResultServer, KeyResultServerDTO } from '../entities/KeyResultServer';
import type { GoalReviewServer, GoalReviewServerDTO } from '../entities/GoalReviewServer';
import type {
  GoalReminderConfigServer,
  GoalReminderConfigServerDTO,
} from '../value-objects';
import type { KeyResultWeightSnapshotServerDTO } from '../value-objects/KeyResultWeightSnapshot';

// ============ DTO 定义 ============

/**
 * Goal Server DTO
 */
export interface GoalServerDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  color?: string | null; // 主题色（hex 格式，如 #FF5733）
  feasibilityAnalysis?: string | null; // 可行性分析
  motivation?: string | null; // 实现动机
  status: GoalStatus;
  importance: ImportanceLevel;
  /** @deprecated urgency 已移除，使用 priority 计算字段 */
  // urgency: UrgencyLevel; // REMOVED
  category?: string | null;
  tags: string[];
  startDate?: number | null; // epoch ms
  targetDate?: number | null; // epoch ms
  completedAt?: number | null; // epoch ms
  archivedAt?: number | null; // epoch ms
  folderUuid?: string | null;
  parentGoalUuid?: string | null;
  sortOrder: number;
  reminderConfig?: GoalReminderConfigServerDTO | null; // 提醒配置
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  deletedAt?: number | null; // epoch ms
  
  /** 计算属性：动态优先级分数 (0-100)，基于 importance + targetDate 计算 */
  priority?: number;

  // ===== 子实体 DTO (聚合根包含子实体) =====
  keyResults?: KeyResultServerDTO[] | null; // 关键结果列表（可选加载）
  reviews?: GoalReviewServerDTO[] | null; // 复盘列表（可选加载）
  weightSnapshots?: KeyResultWeightSnapshotServerDTO[] | null; // KR 权重快照历史（可选加载）
}

/**
 * Goal Persistence DTO (数据库映射)
 * 注意：使用 camelCase 命名，与数据库 snake_case 的映射在仓储层处理
 */
export interface GoalPersistenceDTO {
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  color?: string | null; // 主题色（hex 格式）
  feasibilityAnalysis?: string | null; // 可行性分析
  motivation?: string | null; // 实现动机
  status: GoalStatus;
  importance: ImportanceLevel;
  // urgency: UrgencyLevel; // REMOVED - 不再持久化
  category?: string | null;
  tags: string; // JSON string
  startDate?: Date | null;
  targetDate?: number | null;
  completedAt?: Date | null;
  archivedAt?: number | null;
  folderUuid?: string | null;
  parentGoalUuid?: string | null;
  sortOrder: number;
  reminderConfig?: string | null; // JSON string
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // 注意：子实体在数据库中是独立表，通过外键关联
  // Persistence 层不包含子实体数据
}

// ============ 领域事件 ============

/**
 * 目标创建事件
 */
export interface GoalCreatedEvent {
  type: 'goal.created';
  aggregateId: string; // goalUuid
  timestamp: Date; // epoch ms
  payload: {
    goal: GoalServerDTO;
    accountUuid: string;
    folderUuid?: string | null;
  };
}

/**
 * 目标更新事件
 */
export interface GoalUpdatedEvent {
  type: 'goal.updated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    goal: GoalServerDTO;
    previousData: Partial<GoalServerDTO>;
    changes: string[];
  };
}

/**
 * 目标状态变更事件
 */
export interface GoalStatusChangedEvent {
  type: 'goal.status_changed';
  aggregateId: string;
  timestamp: Date;
  payload: {
    goalUuid: string;
    previousStatus: GoalStatus;
    newStatus: GoalStatus;
    changedAt: Date;
  };
}

/**
 * 目标完成事件
 */
export interface GoalCompletedEvent {
  type: 'goal.completed';
  aggregateId: string;
  timestamp: Date;
  payload: {
    goalUuid: string;
    completedAt: Date;
    finalProgress: number;
  };
}

/**
 * 目标归档事件
 */
export interface GoalArchivedEvent {
  type: 'goal.archived';
  aggregateId: string;
  timestamp: Date;
  payload: {
    goalUuid: string;
    archivedAt: number;
  };
}

/**
 * 目标删除事件
 */
export interface GoalDeletedEvent {
  type: 'goal.deleted';
  aggregateId: string;
  timestamp: Date;
  payload: {
    goalUuid: string;
    deletedAt: Date;
    isSoftDelete: boolean;
  };
}

/**
 * 关键结果添加事件
 */
export interface KeyResultAddedEvent {
  type: 'goal.key_result_added';
  aggregateId: string; // goalUuid
  timestamp: Date;
  payload: {
    goalUuid: string;
    keyResult: KeyResultServerDTO;
  };
}

/**
 * 关键结果更新事件
 */
export interface KeyResultUpdatedEvent {
  type: 'goal.key_result_updated';
  aggregateId: string;
  timestamp: Date;
  payload: {
    goalUuid: string;
    keyResultUuid: string;
    previousValue: number;
    newValue: number;
  };
}

/**
 * 复盘添加事件
 */
export interface GoalReviewAddedEvent {
  type: 'goal.review_added';
  aggregateId: string;
  timestamp: Date;
  payload: {
    goalUuid: string;
    review: GoalReviewServerDTO;
  };
}

// ============ 实体接口 ============

/**
 * Goal 聚合根 - Server 接口（实例方法）
 */
export interface GoalServer {
  // 基础属性
  uuid: string;
  accountUuid: string;
  name: string;
  description?: string | null;
  status: GoalStatus;
  importance: ImportanceLevel;
  // urgency: UrgencyLevel; // REMOVED - priority is computed
  /** 计算属性：动态优先级分数 (0-100) */
  priority: number;
  /** 计算属性：优先级级别 */
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  /** 计算属性：优先级显示文本 */
  priorityText: string;
  category?: string | null;
  tags: string[];
  startDate?: Date | null;
  targetDate?: number | null;
  completedAt?: Date | null;
  archivedAt?: number | null;
  folderUuid?: string | null;
  parentGoalUuid?: string | null;
  sortOrder: number;
  reminderConfig?: GoalReminderConfigServer | null;

  // 时间戳 (统一使用 number epoch ms)
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;

  // ===== 子实体集合（聚合根统一管理） =====

  /**
   * 关键结果列表（懒加载，可选）
   * 通过聚合根统一访问和管理子实体
   */
  keyResults: KeyResultServer[];

  /**
   * 复盘记录列表（懒加载，可选）
   */
  reviews: GoalReviewServer[];

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
  }): KeyResultServer;

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
  }): GoalReviewServer;

  // ===== 子实体管理方法 =====

  /**
   * 添加关键结果到聚合根
   */
  addKeyResult(keyResult: KeyResultServer): void;

  /**
   * 从聚合根移除关键结果
   */
  removeKeyResult(keyResultUuid: string): KeyResultServer | null;

  /**
   * 更新关键结果
   */
  updateKeyResult(keyResultUuid: string, updates: Partial<KeyResultServer>): void;

  /**
   * 重新排序关键结果
   */
  reorderKeyResults(keyResultUuids: string[]): void;

  /**
   * 通过 UUID 获取关键结果
   */
  getKeyResult(uuid: string): KeyResultServer | null;

  /**
   * 获取所有关键结果
   */
  getAllKeyResults(): KeyResultServer[];

  /**
   * 添加复盘记录
   */
  addReview(review: GoalReviewServer): void;

  /**
   * 从聚合根移除复盘
   */
  removeReview(reviewUuid: string): GoalReviewServer | null;

  /**
   * 获取所有复盘记录
   */
  getReviews(): GoalReviewServer[];

  /**
   * 获取最新的复盘记录
   */
  getLatestReview(): GoalReviewServer | null;

  // ===== 提醒配置管理方法 =====

  /**
   * 更新提醒配置
   */
  updateReminderConfig(config: GoalReminderConfigServerDTO): void;

  /**
   * 启用提醒
   */
  enableReminder(): void;

  /**
   * 禁用提醒
   */
  disableReminder(): void;

  /**
   * 添加提醒触发器
   */
  addReminderTrigger(trigger: { type: string; value: number }): void;

  /**
   * 移除提醒触发器
   */
  removeReminderTrigger(type: string, value: number): void;

  // ===== 状态管理方法 =====

  /**
   * 激活目标
   */
  activate(): void;

  /**
   * 完成目标
   */
  complete(): void;

  /**
   * 归档目标
   */
  archive(): void;

  /**
   * 软删除目标
   */
  softDelete(): void;

  /**
   * 恢复目标
   */
  restore(): void;

  // ===== 进度计算方法 =====

  /**
   * 计算总体进度
   */
  calculateProgress(): number;

  /**
   * 检查是否逾期
   */
  isOverdue(): boolean;

  /**
   * 获取剩余天数
   */
  getDaysRemaining(): number | null;

  /**
   * 获取优先级得分
   */
  getPriorityScore(): number;

  // ===== 转换方法 (To) =====

  /**
   * 转换为 Server DTO（递归转换子实体）
   * @param includeChildren 是否包含子实体（默认 false）
   */
  toServerDTO(includeChildren?: boolean): GoalServerDTO;

  /**
   * 转换为 Persistence DTO
   * 注意：Persistence 不包含子实体，子实体单独持久化
   */
  toPersistenceDTO(): GoalPersistenceDTO;
}

/**
 * Goal 静态工厂方法接口
 * 注意：TypeScript 接口不能包含静态方法，这些方法应该在类上实现
 */
export interface GoalServerStatic {
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
    // urgency: UrgencyLevel; // REMOVED - priority is computed from importance + targetDate
    category?: string;
    tags?: string[];
    startDate?: Date;
    targetDate?: number;
    folderUuid?: string;
    parentGoalUuid?: string;
  }): GoalServer;

  /**
   * 从 Server DTO 创建实体（递归创建子实体）
   */
  fromServerDTO(dto: GoalServerDTO): GoalServer;

  /**
   * 从 Persistence DTO 创建实体
   * 注意：需要单独加载子实体
   */
  fromPersistenceDTO(dto: GoalPersistenceDTO): GoalServer;
}
