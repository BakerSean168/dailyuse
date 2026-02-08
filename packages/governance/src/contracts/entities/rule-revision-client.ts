/**
 * RuleRevision Entity - Client Interface
 * 规则修订记录实体 - 客户端接口
 *
 * Client 端看到的修订记录是脱敏的：
 * - 显示审计历史和变更详情
 * - 不包含敏感的内部实现细节
 * - 提供用户友好的变更摘要
 */

import type { DomainDate, TransferDate, RuleRevisionId, RuleId, IdentityId } from '@dailyuse/contracts/primitives';

// ============ Domain Shape ============

/**
 * Client 端规则修订记录
 * 
 * 用于展示规则的变更历史，让用户了解：
 * - 谁在什么时候做了修改
 * - 修改了哪些字段
 * - 修改前后的值对比
 */
export interface RuleRevisionClient {
  id: RuleRevisionId;
  ruleId: RuleId;
  revisionNumber: number;
  authorId: IdentityId;
  changedFields: readonly string[];
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  changeType: 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';
  createdAt: DomainDate;
}

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
  changeType: 'Created' | 'Updated' | 'Deprecated' | 'Reactivated';
  createdAt: TransferDate;
}
