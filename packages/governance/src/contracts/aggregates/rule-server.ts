/**
 * Rule Aggregate Root - Server Contracts
 * 规则聚合根 - 服务端契约
 */

import type { TransferDate, PersistenceDate, IdentityId } from '@dailyuse/contracts/primitives';
import type { RuleId } from '../primitives/ids';
import type { RuleTagDTO } from '../value-objects/rule-tag';
import type { RuleStatus } from '../value-objects/rule-status';
import type { RuleSeverity } from '../value-objects/rule-severity';
import type { CodeSnippetDTO } from '../value-objects/code-snippet';

// ============ Transfer DTO (传输层) ============

/**
 * Rule Server DTO
 * API 传输对象
 */
export interface RuleServerDTO {
  id: RuleId;
  code: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  status: RuleStatus;
  deprecationReason: string | null;
  replacementRuleId: RuleId | null;
  liveReferenceLocation: string | null;
  tags: RuleTagDTO[];
  goodExamples: CodeSnippetDTO[];
  badExamples: CodeSnippetDTO[];
  authorId: IdentityId;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

// ============ Persistence DTO (持久化层) ============

/**
 * Rule Persistence DTO — database storage format.
 * 规则持久化 DTO — 数据库存储格式。
 *
 * Uses plain string types for JSON serialization.
 * 使用纯字符串类型以支持 JSON 序列化。
 *
 * @internal Repository implementation detail. Consumers should use RuleClientDTO or RuleServerDTO.
 * @internal 仓储实现细节，消费者应使用 RuleClientDTO 或 RuleServerDTO。
 */
export interface RulePersistenceDTO {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  deprecationReason: string | null;
  replacementRuleId: string | null;
  liveReferenceLocation: string | null;
  tags: string; // JSON array
  goodExamples: string; // JSON array of CodeSnippetPersistenceDTO
  badExamples: string; // JSON array of CodeSnippetPersistenceDTO
  authorId: string;
  createdAt: PersistenceDate;
  updatedAt: PersistenceDate;
}
