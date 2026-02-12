/**
 * IRuleRevisionRepository - Repository interface for RuleRevision entity
 * 
 * Provides read-only access to revision history
 * (RuleRevisions are created automatically by Rule aggregate, not directly)
 */

import type { Result } from '@dailyuse/contracts/result';
import type { RuleRevision } from '../entities/rule-revision';
import { RuleId, RuleRevisionId } from '../../domain-shared/value-objects';

/**
 * Rule Revision repository interface
 * 
 * Read-only repository for audit trail access
 */
export interface IRuleRevisionRepository {
  /**
   * Saves revision (insert only - revisions are immutable)
   */
  save(revision: RuleRevision): Promise<Result<void>>;

  /**
   * Finds all revisions for a rule
   */
  findByRuleId(ruleId: RuleId): Promise<Result<RuleRevision[]>>;

  /**
   * Finds specific revision by rule ID and revision number
   */
  findByRuleIdAndNumber(
    ruleId: RuleId,
    revisionNumber: number
  ): Promise<Result<RuleRevision | null>>;

  /**
   * Counts total revisions for a rule
   */
  countByRuleId(ruleId: RuleId): Promise<Result<number>>;
}

/**
 * DI token for IRuleRevisionRepository binding
 */
export const RULE_REVISION_REPOSITORY_TOKEN = Symbol('IRuleRevisionRepository');
