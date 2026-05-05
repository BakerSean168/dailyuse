/**
 * ValidationRule Value Object
 * 验证规则值对象
 */

// ============ DTO 定义 ============

/**
 * ValidationRule DTO
 */
export interface ValidationRuleDTO {
  required: boolean;
  min: number | null;
  max: number | null;
  pattern: string | null;
  enum: unknown[] | null;
  custom: string | null;
}

// ============ 值对象接口 ============

/**
 * ValidationRule 值对象接口
 */
export interface ValidationRule {
  required: boolean;
  min: number | null;
  max: number | null;
  pattern: string | null;
  enum: unknown[] | null;
  custom: string | null;
}
