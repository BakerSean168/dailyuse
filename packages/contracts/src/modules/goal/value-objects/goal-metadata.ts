/**
 * Goal Metadata Value Object Contracts
 * 目标元数据值对象契约
 *
 * 注意：Contracts 包只包含纯类型定义，不包含业务逻辑或方法
 */

import type { ImportanceLevel } from '../../../shared/index';

// ============ Domain Shape (领域层) ============

/**
 * 目标元数据 - Domain Shape
 * 给 domain-shared 中的 Class 实现用
 */
export interface GoalMetadata {
  importance: ImportanceLevel;
  category: string | null;
  tags: string[];
}

// ============ Transfer DTO (传输层) ============

/**
 * Goal Metadata DTO
 * API 传输用 (Server → Client)
 */
export interface GoalMetadataDTO {
  importance: ImportanceLevel;
  category: string | null;
  tags: string[];
}

/**
 * Goal Metadata Client DTO
 * 包含 UI 显示用的计算属性
 */
export interface GoalMetadataClientDTO {
  importance: ImportanceLevel;
  category: string | null;
  tags: string[];
  // UI 显示属性
  importanceText: string;
  priorityBadgeColor: string;
  categoryDisplay: string;
  tagsDisplay: string;
}

// ============ Persistence DTO (持久化层) ============

/**
 * Goal Metadata Persistence DTO
 * 数据库存储用
 */
export interface GoalMetadataPersistenceDTO {
  importance: ImportanceLevel;
  category: string | null;
  tags: string; // JSON string: JSON.stringify(string[])
}
