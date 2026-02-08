/**
 * Rule Aggregate Root - Client Contracts
 * 规则聚合根 - 客户端契约
 */

import type { DomainDate, TransferDate, RuleId, IdentityId } from '@dailyuse/contracts/primitives';
import type { RuleStatus } from '../value-objects/rule-status';
import type { RuleSeverity } from '../value-objects/rule-severity';
import type { CodeSnippet, CodeSnippetDTO } from '../value-objects/code-snippet';

// ============ Domain Shape ============

/**
 * Rule aggregate - Client Domain Shape
 * 客户端领域接口（用于 domain-client 实现）
 */
export interface RuleClient {
  id: RuleId;
  code: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  status: RuleStatus;
  deprecationReason: string | null;
  replacementRuleId: RuleId | null;
  liveReferenceLocation: string | null;
  tags: string[];
  goodExamples: CodeSnippet[];
  badExamples: CodeSnippet[];
  authorId: IdentityId;
  createdAt: DomainDate;
  updatedAt: DomainDate;
}

// ============ Transfer DTO (传输层) ============

/**
 * Rule Client DTO
 * 客户端数据传输对象（API 响应）
 */
export interface RuleClientDTO {
  id: RuleId;
  code: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  status: RuleStatus;
  deprecationReason: string | null;
  replacementRuleId: RuleId | null;
  liveReferenceLocation: string | null;
  tags: string[];
  goodExamples: CodeSnippetDTO[];
  badExamples: CodeSnippetDTO[];
  authorId: IdentityId;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}
