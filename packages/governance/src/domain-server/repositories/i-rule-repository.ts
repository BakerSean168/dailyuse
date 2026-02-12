/**
 * IRuleRepository - Repository interface for Rule aggregate
 * 
 * Demonstrates dependency inversion:
 * - Domain defines interface
 * - Infrastructure implements it
 * - DI token for container binding
 */

import type { Result } from '@dailyuse/contracts/result';
import type { Rule } from '../aggregates/rule';
import { RuleId } from '../../domain-shared/value-objects/rule-id';
import type { RuleStatus } from '../../contracts/value-objects/rule-status';

/**
 * Filter object for rule queries
 */
export interface RuleFilter {
  status?: RuleStatus;
  tags?: string[];
  severity?: string;
}

/**
 * Rule repository interface
 */
export interface IRuleRepository {
  /**
   * Saves rule (insert or update)
   */
  save(rule: Rule): Promise<Result<void>>;

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
   * Checks if rule code exists
   */
  exists(code: string): Promise<boolean>;
}

/**
 * DI token for IRuleRepository binding
 */
export const RULE_REPOSITORY_TOKEN = Symbol('IRuleRepository');
