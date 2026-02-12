/**
 * RuleTag Value Object
 * 规则标签值对象
 */

// ============ Domain Shape ============

/**
 * RuleTag Value Object
 * 规则标签（自动规范化为 lowercase-kebab-case）
 */
export interface RuleTag {
  value: string;
}

// ============ Transfer DTO (传输层) ============

export interface RuleTagDTO {
  value: string;
}

// ============ Persistence DTO (持久化层) ============

export interface RuleTagPersistenceDTO {
  value: string;
}
