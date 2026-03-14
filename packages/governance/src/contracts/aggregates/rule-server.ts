/**
 * Rule Aggregate Root - Server Contracts
 * 规则聚合根 - 服务端契约
 */

import type { TransferDate, IdentityId } from '@dailyuse/contracts/primitives';
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
