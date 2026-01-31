/**
 * ValidationRule Value Object - Server Interface
 * 验证规则值对象 - 服务端接口
 */

import type { ValidationRuleClientDTO } from './ValidationRuleClient';

// ============ DTO 定义 ============

/**
 * ValidationRule Server DTO
 */
export interface ValidationRuleServerDTO {
  required: boolean;
  min?: number | null;
  max?: number | null;
  pattern?: string | null;
  enum?: any[] | null;
  custom?: string | null;
}

/**
 * ValidationRule Persistence DTO
 */
export interface ValidationRulePersistenceDTO {
  required: boolean;
  min?: number | null;
  max?: number | null;
  pattern?: string | null;
  enum?: string | null; // JSON string
  custom?: string | null;
}

// ============ 值对象接口 ============

export interface ValidationRuleServer {
  required: boolean;
  min?: number | null;
  max?: number | null;
  pattern?: string | null;
  enum?: any[] | null;
  custom?: string | null;
