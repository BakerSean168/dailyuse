/**
 * RuleRevision Entity - Server Interface
 * 规则修订记录实体 - 服务端接口
 *
 * Server 端的修订记录包含完整的审计信息：
 * - 完整的变更详情
 * - 数据库持久化映射
 * - 内部实现细节
 */

import type { TransferDate, PersistenceDate, IdentityId } from '@dailyuse/contracts/primitives';
import type { RuleRevisionId, RuleId } from '../primitives/ids';

// ============ Transfer DTO (传输层) ============

/**
 * Server DTO (Internal)
 * 服务端内部使用的数据结构
 */
export interface RuleRevisionServerDTO {
  id: RuleRevisionId;
  ruleId: RuleId;
  revisionNumber: number;
  authorId: IdentityId;
  changedFields: string[];
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  changeType: 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';
  createdAt: TransferDate;
}

// ============ Persistence DTO (持久化层) ============

/**
 * RuleRevision Persistence DTO — database storage format.
 * 规则修订持久化 DTO — 数据库存储格式。
 *
 * changedFields, previousValues, newValues are stored as JSON strings.
 * changedFields、previousValues、newValues 存储为 JSON 字符串。
 *
 * @internal Repository implementation detail. Consumers should use RuleRevisionClientDTO or RuleRevisionServerDTO.
 * @internal 仓储实现细节，消费者应使用 RuleRevisionClientDTO 或 RuleRevisionServerDTO。
 */
export interface RuleRevisionPersistenceDTO {
  id: string;
  ruleId: string;
  revisionNumber: number;
  authorId: string;
  changedFields: string; // JSON array
  previousValues: string | null; // JSON object
  newValues: string | null; // JSON object
  changeType: string;
  createdAt: PersistenceDate;
}
