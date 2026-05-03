/**
 * IRuleRevisionRepository - Repository interface for RuleRevision entity.
 * IRuleRevisionRepository - RuleRevision 实体的仓储接口。
 *
 * Provides read-only access to revision history.
 * 提供修订历史的只读访问。
 * (RuleRevisions are created automatically by Rule aggregate, not directly)
 * （RuleRevision 由 Rule 聚合根自动创建，不可直接操作）
 */

import type { RuleRevision } from '../entities/rule-revision';
import { RuleId } from '../../domain-shared/value-objects';

/**
 * Rule Revision repository interface.
 * 规则修订记录仓储接口。
 *
 * Read-only repository for audit trail access.
 * 用于审计记录访问的只读仓储。
 */
export interface IRuleRevisionRepository {
  /**
   * Saves revision (insert only — revisions are immutable). 保存修订记录（仅插入 — 修订记录不可变）。
   */
  save(revision: RuleRevision): Promise<void>;

  /**
   * Finds all revisions for a rule. 查找指定规则的所有修订记录。
   */
  findByRuleId(ruleId: RuleId): Promise<RuleRevision[]>;

  /**
   * Finds specific revision by rule ID and revision number. 根据规则 ID 和修订编号查找特定修订记录。
   */
  findByRuleIdAndNumber(
    ruleId: RuleId,
    revisionNumber: number,
  ): Promise<RuleRevision | null>;

  /**
   * Counts total revisions for a rule. 统计指定规则的修订记录总数。
   */
  countByRuleId(ruleId: RuleId): Promise<number>;
}

/**
 * DI token for IRuleRevisionRepository binding.
 * IRuleRevisionRepository 绑定的依赖注入 token。
 */
export const RULE_REVISION_REPOSITORY_TOKEN = Symbol('IRuleRevisionRepository');
