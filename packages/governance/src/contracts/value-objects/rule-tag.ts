/**
 * RuleTag Value Object
 * 规则标签值对象
 */

// ============ Transfer DTO (传输层) ============

export interface RuleTagDTO {
  value: string;
}

// ============ Persistence DTO (持久化层) ============

/**
 * RuleTag Persistence DTO — database storage format.
 * 规则标签持久化 DTO — 数据库存储格式。
 *
 * @internal Repository implementation detail. Consumers should use RuleTagDTO.
 * @internal 仓储实现细节，消费者应使用 RuleTagDTO。
 */
export interface RuleTagPersistenceDTO {
  value: string;
}
