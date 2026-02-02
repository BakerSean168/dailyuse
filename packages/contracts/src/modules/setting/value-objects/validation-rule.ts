/**
 * ValidationRule Value Object
 * 验证规则值对象
 */

// ============ DTO 定义 ============

/**
 * ValidationRule DTO (Server)
 */
export interface ValidationRuleDTO {
  required: boolean;
  min: number | null;
  max: number | null;
  pattern: string | null;
  enum: any[] | null;
  custom: string | null;
}

/**
 * ValidationRule Client DTO
 */
export interface ValidationRuleClientDTO {
  required: boolean;
  min: number | null;
  max: number | null;
  pattern: string | null;
  enum: any[] | null;
  custom: string | null;
}

/**
 * ValidationRule Persistence DTO
 */
export interface ValidationRulePersistenceDTO {
  required: boolean;
  min: number | null;
  max: number | null;
  pattern: string | null;
  enum: string | null; // JSON string
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
  enum: any[] | null;
  custom: string | null;
}

/**
 * ValidationRule Client 值对象接口
 */
export interface ValidationRuleClient {
  required: boolean;
  min: number | null;
  max: number | null;
  pattern: string | null;
  enum: any[] | null;
  custom: string | null;
}


