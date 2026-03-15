/**
 * RuleRevision Entity - Server Interface
 * 规则修订记录实体 - 服务端接口
 *
 * Server 端的修订记录包含完整的审计信息：
 * - 完整的变更详情
 * - 数据库持久化映射
 * - 内部实现细节
 */

import type { TransferDate, IdentityId } from '@dailyuse/contracts/primitives';
import type { RuleRevisionId, RuleId } from '../primitives/ids';
import type { ChangeType } from '../value-objects/change-type';

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
  changeType: ChangeType;
  createdAt: TransferDate;
}
