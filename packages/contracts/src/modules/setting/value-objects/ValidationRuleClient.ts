/**
 * ValidationRule Value Object - Client Interface
 * 验证规则值对象 - 客户端接口
 */

import type { ValidationRuleServerDTO } from './ValidationRuleServer';

// ============ DTO 定义 ============

/**
 * ValidationRule Client DTO
 */
export interface ValidationRuleClientDTO {
  required: boolean;
  min?: number | null;
  max?: number | null;
  pattern?: string | null;
  enum?: any[] | null;
  custom?: string | null;
}

// ============ 值对象接口 ============

export interface ValidationRuleClient {
  required: boolean;
  min?: number | null;
  max?: number | null;
  pattern?: string | null;
  enum?: any[] | null;
  custom?: string | null;

  // UI 方法
  hasMinConstraint(): boolean;
  hasMaxConstraint(): boolean;
  hasPattern(): boolean;
  hasEnum(): boolean;
  getConstraintText(): string;}
