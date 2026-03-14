/**
 * IRuleRepository - Repository interface for Rule aggregate.
 * IRuleRepository - Rule 聚合根的仓储接口。
 *
 * Demonstrates dependency inversion:
 * 演示依赖倒置：
 * - Domain defines interface / 领域层定义接口
 * - Infrastructure implements it / 基础设施层实现接口
 * - DI token for container binding / DI token 用于容器绑定
 */

import type { Result } from '@dailyuse/contracts/result';
import type { Rule } from '../aggregates/rule';
import type { RuleRevision } from '../entities/rule-revision';
import { RuleId } from '../../domain-shared/value-objects/rule-id';
import type { RuleStatus } from '../../contracts/value-objects/rule-status';
import type { RuleSeverity } from '../../contracts/value-objects/rule-severity';

/**
 * Filter object for rule queries.
 * 规则查询的筛选对象。
 */
export interface RuleFilter {
  status?: RuleStatus;
  tags?: string[];
  severity?: RuleSeverity;
}

/**
 * Rule repository interface.
 * 规则仓储接口。
 */
export interface IRuleRepository {
  /**
   * Saves rule (insert or update)
   */
  save(rule: Rule): Promise<Result<void>>;

  /**
   * Saves rule and revision atomically in a single transaction
   */
  saveWithRevision(rule: Rule, revision: RuleRevision): Promise<Result<void>>;

  /**
   * Finds rule by ID
   */
  findById(id: RuleId): Promise<Result<Rule | null>>;

  /**
   * Finds rule by unique code
   */
  findByCode(code: string): Promise<Result<Rule | null>>;

  /**
   * Finds all rules matching filter
   */
  findAll(filter?: RuleFilter): Promise<Result<Rule[]>>;

  /**
   * Searches rules by keyword (title, description, code, tags)
   */
  search(query: string, filter?: RuleFilter): Promise<Result<Rule[]>>;

  /**
   * Deletes rule (soft delete for rules with revisions)
   */
  delete(id: RuleId): Promise<Result<void>>;

  /**
   * Checks if a rule with the given code already exists.
   * 检查指定代码的规则是否已存在。
   *
   * @param code - Rule code to check 要检查的规则代码
   * @returns Result<boolean> - ok(true) if exists, ok(false) if not, error on failure
   *          ok(true) 如果存在，ok(false) 如果不存在，失败时返回 error
   */
  exists(code: string): Promise<Result<boolean>>;
}

/**
 * DI token for IRuleRepository binding.
 * IRuleRepository 绑定的依赖注入 token。
 */
export const RULE_REPOSITORY_TOKEN = Symbol('IRuleRepository');
