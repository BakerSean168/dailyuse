/**
 * Goal Metadata Value Object Contracts
 * 目标元数据值对象契约
 *
 * Residual 853: GoalMetadataDTO dual retired — sole GoalMetadata interface + type alias.
 * 注意：Contracts 包只包含纯类型定义，不包含业务逻辑或方法
 */

import type { ImportanceLevel } from '../../../shared/index';

// Residual 853: sole GoalMetadata body.
export interface GoalMetadata {
  importance: ImportanceLevel;
  category: string | null;
  tags: string[];
}

// Residual 853: GoalMetadataDTO dual retired — DTO is the GoalMetadata shape.
export type GoalMetadataDTO = GoalMetadata;
