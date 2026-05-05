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

