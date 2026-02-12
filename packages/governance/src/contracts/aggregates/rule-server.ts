/**
 * Rule Aggregate Root - Server Contracts
 * 规则聚合根 - 服务端契约
 */

import type { TransferDate, PersistenceDate, IdentityId } from '@dailyuse/contracts/primitives';
import type { RuleId } from '../primitives/ids';
import type { RuleTag, RuleTagDTO } from '../value-objects/rule-tag';
import type { RuleStatus } from '../value-objects/rule-status';
import type { RuleSeverity } from '../value-objects/rule-severity';
import type { CodeSnippet, CodeSnippetDTO, CodeSnippetPersistenceDTO } from '../value-objects/code-snippet';

// ============ Domain Shape ============

/**
 * Rule aggregate - Server Domain Shape
 * 服务端领域接口（用于 domain-server 实现）
 */
export interface RuleServer {
  id: RuleId;
  code: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  status: RuleStatus;
  deprecationReason: string | null;
  replacementRuleId: RuleId | null;
  liveReferenceLocation: string | null;
  tags: RuleTag[];
  goodExamples: CodeSnippet[];
  badExamples: CodeSnippet[];
  authorId: IdentityId;
  createdAt: Date;
  updatedAt: Date;

  // ================= 实体操作方法 =================
  /**
   * 转换为 Client DTO
   */
  toClientDTO(): import('./rule-client').RuleClientDTO;

  /**
   * 转换为 Persistence DTO
   */
  toPersistenceDTO(): RulePersistenceDTO;
}

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
 * Rule Persistence DTO
 * 数据库存储用
 * 注意：使用 camelCase 命名
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
