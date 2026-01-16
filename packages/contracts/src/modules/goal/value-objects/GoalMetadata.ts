/**
 * Goal Metadata Value Object
 * 目标元数据值对象
 */

import type { ImportanceLevel } from '../../../shared/index';

// ============ 接口定义 ============

/**
 * 目标元数据 - Server 接口
 */
export interface IGoalMetadataServer {
  importance: ImportanceLevel;
  // urgency: UrgencyLevel; // REMOVED
  category?: string | null;
  tags: string[];

  // 值对象方法
  equals(other: IGoalMetadataServer): boolean;
  with(
    updates: Partial<
      Omit<
        IGoalMetadataServer,
        'equals' | 'with' | 'toServerDTO' | 'toClientDTO' | 'toPersistenceDTO'
      >
    >,
  ): IGoalMetadataServer;

  // 业务方法
  /** @deprecated 优先级现在由 GoalPriorityCalculator 域服务计算 */
  getPriority(): number;
  hasTag(tag: string): boolean;
  addTag(tag: string): IGoalMetadataServer;
  removeTag(tag: string): IGoalMetadataServer;

  // DTO 转换方法
  toServerDTO(): GoalMetadataServerDTO;
  toClientDTO(): GoalMetadataClientDTO;
  toPersistenceDTO(): GoalMetadataPersistenceDTO;
}

/**
 * 目标元数据 - Client 接口
 */
export interface IGoalMetadataClient {
  importance: ImportanceLevel;
  // urgency: UrgencyLevel; // REMOVED
  category?: string | null;
  tags: string[];

  // UI 辅助属性
  importanceText: string; // "非常重要" / "重要" / "一般" / "不重要"
  // urgencyText: string; // REMOVED
  /** 动态优先级分数 (0-100) */
  priority: number;
  /** 优先级级别 */
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  /** 优先级显示文本 */
  priorityText: string;
  priorityBadgeColor: string; // 优先级徽章颜色
  categoryDisplay: string; // 分类显示文本，如果为空则显示"未分类"
  tagsDisplay: string; // 标签显示文本，如 "标签1, 标签2"

  // 值对象方法
  equals(other: IGoalMetadataClient): boolean;

  // UI 辅助方法
  hasTag(tag: string): boolean;

  // DTO 转换方法
  toServerDTO(): GoalMetadataServerDTO;
}

// ============ DTO 定义 ============

/**
 * Goal Metadata Server DTO
 */
export interface GoalMetadataServerDTO {
  importance: ImportanceLevel;
  // urgency: UrgencyLevel; // REMOVED
  category?: string | null;
  tags: string[];
}

/**
 * Goal Metadata Client DTO
 */
export interface GoalMetadataClientDTO {
  importance: ImportanceLevel;
  // urgency: UrgencyLevel; // REMOVED
  category?: string | null;
  tags: string[];
  importanceText: string;
  // urgencyText: string; // REMOVED
  priority: number;
  priorityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priorityText: string;
  priorityBadgeColor: string;
  categoryDisplay: string;
  tagsDisplay: string;
}

/**
 * Goal Metadata Persistence DTO
 */
export interface GoalMetadataPersistenceDTO {
  importance: ImportanceLevel;
  // urgency: UrgencyLevel; // REMOVED
  category?: string | null;
  tags: string; // JSON string: JSON.stringify(string[])
}

// ============ 类型导出 ============

export type GoalMetadataServer = IGoalMetadataServer;
export type GoalMetadataClient = IGoalMetadataClient;
