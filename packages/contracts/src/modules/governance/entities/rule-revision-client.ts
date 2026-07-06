/**
 * RuleRevision Entity - Client Interface
 * 规则修订记录实体 - 客户端接口
 *
 * Client 端看到的修订记录是脱敏的：
 * - 显示审计历史和变更详情
 * - 不包含敏感的内部实现细节
 * - 提供用户友好的变更摘要
 */

import type { TransferDate, IdentityId } from '@dailyuse/contracts/primitives';
import type { RuleRevisionId, RuleId } from '../primitives/ids';
import type { ChangeType } from '../value-objects/change-type';

// ============ Transfer DTO (传输层) ============

/**
 * Client DTO (API Response)
 * 这就是返回给前端的数据结构
 */
export interface RuleRevisionClientDTO {
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
