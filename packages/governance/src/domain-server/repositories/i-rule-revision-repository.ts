/**
 * IRuleRevisionRepository - Repository interface for RuleRevision entity.
 * IRuleRevisionRepository - RuleRevision 实体的仓储接口。
 *
 * Provides read-only access to revision history.
 * 提供修订历史的只读访问。
 * (RuleRevisions are created automatically by Rule aggregate, not directly)
 * （RuleRevision 由 Rule 聚合根自动创建，不可直接操作）
 */

import type { Result } from '@dailyuse/contracts/result';
import type { RuleRevision } from '../entities/rule-revision';
import { RuleId, RuleRevisionId } from '../../domain-shared/value-objects';

/**
 * Rule Revision repository interface.
 * 规则修订记录仓储接口。
 *
 * Read-only repository for audit trail access.
 * 用于审计记录访问的只读仓储。
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
    revisionNumber: number,
  ): Promise<Result<RuleRevision | null>>;

  /**
   * Counts total revisions for a rule
   */
  countByRuleId(ruleId: RuleId): Promise<Result<number>>;
}

/**
 * DI token for IRuleRevisionRepository binding.
 * IRuleRevisionRepository 绑定的依赖注入 token。
 */
export const RULE_REVISION_REPOSITORY_TOKEN = Symbol('IRuleRevisionRepository');
