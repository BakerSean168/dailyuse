/**
 * Rule Aggregate - Server DTO
 */

import type { TransferDate } from '@dailyuse/contracts/shared';
import type { RuleStatus } from '../value-objects/rule-status';
import type { RuleSeverity } from '../value-objects/rule-severity';
import type { CodeSnippet, RuleTag } from './rule-client';

/**
 * Exports same structure as Client DTO for now
 * Future: May add server-only fields (e.g., internal metadata)
 */
export interface RuleServerDTO {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: RuleSeverity;
  status: RuleStatus;
  deprecationReason?: string;
  replacementRuleId?: string;
  liveReferenceLocation?: string;
  tags: RuleTag[];
  codeSnippets: CodeSnippet[];
  authorId: string;
  createdAt: TransferDate;
  updatedAt: TransferDate;
}

/**
 * RulePersistenceDTO - Database representation (for Prisma)
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
  tags: string; // JSON
  codeSnippets: string; // JSON
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}
