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

import type { Rule } from '../aggregates/rule';
import type { RuleRevision } from '../entities/rule-revision';
import { RuleId } from '../value-objects/rule-id';
import type { RuleStatus } from '@dailyuse/contracts/governance';
import type { RuleSeverity } from '@dailyuse/contracts/governance';

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
   * Saves rule (insert or update). 保存规则（插入或更新）。
   */
  save(rule: Rule): Promise<void>;

  /**
   * Saves rule and revision atomically in a single transaction. 在单个事务中原子保存规则和修订记录。
   */
  saveWithRevision(rule: Rule, revision: RuleRevision): Promise<void>;

  /**
   * Finds rule by ID. 根据 ID 查找规则。
   */
  findById(id: RuleId): Promise<Rule | null>;

  /**
   * Finds rule by unique code. 根据唯一代码查找规则。
   */
  findByCode(code: string): Promise<Rule | null>;

  /**
   * Finds all rules matching filter. 查找所有匹配筛选条件的规则。
   */
  findAll(filter?: RuleFilter): Promise<Rule[]>;

  /**
   * Searches rules by keyword (title, description, code, tags). 按关键词搜索规则（标题、描述、代码、标签）。
   */
  search(query: string, filter?: RuleFilter): Promise<Rule[]>;

  /**
   * Deletes rule (hard delete for Draft, soft delete for others). 删除规则（草稿硬删除，其他软删除）。
   */
  delete(id: RuleId): Promise<void>;

  /**
   * Checks if a rule with the given code already exists.
   * 检查指定代码的规则是否已存在。
   *
   * @param code - Rule code to check 要检查的规则代码
   * @returns true if exists, false if not; throws on infrastructure failure
   *          存在返回 true，不存在返回 false；基础设施失败时抛异常
   */
  exists(code: string): Promise<boolean>;
}

/**
 * DI token for IRuleRepository binding.
 * IRuleRepository 绑定的依赖注入 token。
 */
export const RULE_REPOSITORY_TOKEN = Symbol('IRuleRepository');

