/**
 * Rule Aggregate DTOs
 * 
 * Separated into Client, Server, and Persistence DTOs per architecture
 */

import type { TransferDate } from '@dailyuse/contracts/shared';
import type { RuleStatus } from '../value-objects/rule-status';
import type { RuleSeverity } from '../value-objects/rule-severity';
import type { Language } from '../value-objects/language';
import type { SnippetType } from '../value-objects/snippet-type';

/**
 * RuleId - Branded type for Rule identifiers
 */
export interface RuleId {
  __brand: 'RuleId';
}

/**
 * UserId - Branded type for User identifiers
 */
export interface UserId {
  __brand: 'UserId';
}

/**
 * CodeSnippet - Code example attached to a Rule
 */
export interface CodeSnippet {
  id: string;
  language: Language;
  content: string; // Max 10KB
  type: SnippetType;
  caption?: string; // Max 200 chars
}

/**
 * RuleTag - Normalized tag label
 */
export type RuleTag = string; // Must be lowercase-kebab-case

/**
 * RuleClientDTO - Client-side representation (for web/desktop UI)
 */
export interface RuleClientDTO {
  id: string;
  code: string;
  title: string;
  description: string; // Markdown
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
 * RuleServerDTO - Server-side representation (for API responses)
 */
export interface RuleServerDTO {
  id: string;
  code: string;
  title: string;
  description: string; // Markdown
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
  severity: string; // Enum string
  status: string; // Enum string
  deprecationReason: string | null;
  replacementRuleId: string | null;
  liveReferenceLocation: string | null;
  tags: string; // JSON array
  codeSnippets: string; // JSON array
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}
