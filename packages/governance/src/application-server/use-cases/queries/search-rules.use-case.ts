/**
 * Search Rules Use Case
 * 搜索规则用例
 */

import type { IRuleRepository, RuleFilter } from '@/domain-server/repositories/i-rule-repository';
import type { Rule } from '@/domain-server/aggregates/rule';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { SearchRulesQuery, SearchRulesRes } from '../../../contracts/api/rules';
import type { RuleClientDTO } from '../../../contracts/aggregates/rule-client';
import { RuleStatus } from '../../../contracts/value-objects/rule-status';
import type { ExecutionContext } from '../commands/create-rule.use-case';

type SearchFilters = Partial<Omit<SearchRulesQuery, 'query'>>;

/**
 * Search Rules Use Case.
 * 搜索规则用例。
 */
export class SearchRulesUseCase {
  constructor(private readonly ruleRepository: IRuleRepository) {}

  /**
   * Execute: Search with relevance scoring and status weighting
   *
   * Relevance priority:
   * - title exact > title partial > code > description > tags
   *
   * Status weight:
   * - Active > Draft > Deprecated
   */
  async execute(
    query: string,
    filters: SearchFilters = {},
    _cx?: ExecutionContext,
  ): Promise<Result<SearchRulesRes>> {
    const startedAt = Date.now();

    const normalizedQuery = query.trim();
    if (normalizedQuery.length === 0) {
      return error('VALIDATION_ERROR', 'Search query cannot be empty');
    }

    const filter: RuleFilter = {};
    if (filters.status) {
      filter.status = filters.status;
    }
    if (filters.severity) {
      filter.severity = filters.severity;
    }
    if (filters.tags) {
      filter.tags = filters.tags;
    }

    const rulesResult = await this.ruleRepository.search(normalizedQuery, filter);
    if (!rulesResult.ok) {
      return error(rulesResult.error.code, rulesResult.error.message, rulesResult.error.details);
    }

    const scoredRules = rulesResult.data
      .map((rule) => ({
        rule,
        score: this.calculateRelevanceScore(rule, normalizedQuery),
      }))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }
        return right.rule.updatedAt.getTime() - left.rule.updatedAt.getTime();
      });

    const total = scoredRules.length;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const items = scoredRules
      .slice(offset, offset + pageSize)
      .map(({ rule }) => this.toClientDTO(rule));

    return ok({
      items,
      total,
      page,
      pageSize,
      searchTime: Date.now() - startedAt,
    });
  }

  private calculateRelevanceScore(rule: Rule, query: string): number {
    const lowerQuery = query.toLowerCase();
    const title = rule.title.toLowerCase();
    const code = rule.code.toLowerCase();
    const description = rule.description.toLowerCase();
    const tagValues = rule.tags.map((tag) => tag.value.toLowerCase());

    let score = 0;

    if (title === lowerQuery) {
      score += 100;
    } else if (title.includes(lowerQuery)) {
      score += 70;
    }

    if (code.includes(lowerQuery)) {
      score += 50;
    }

    if (description.includes(lowerQuery)) {
      score += 30;
    }

    if (tagValues.some((tag) => tag.includes(lowerQuery))) {
      score += 20;
    }

    score += this.statusWeight(rule.status);

    return score;
  }

  private statusWeight(status: string): number {
    if (status === RuleStatus.Active) return 15;
    if (status === RuleStatus.Draft) return 10;
    if (status === RuleStatus.Deprecated) return 5;
    return 0;
  }

  private toClientDTO(rule: Rule): RuleClientDTO {
    return {
      id: rule.id,
      code: rule.code,
      title: rule.title,
      description: rule.description,
      severity: rule.severity,
      status: rule.status,
      deprecationReason: rule.deprecationReason,
      replacementRuleId: rule.replacementRuleId,
      liveReferenceLocation: rule.liveReferenceLocation,
      tags: rule.tags.map((tag) => tag.toDTO()),
      goodExamples: rule.goodExamples.map((ex) => ex.toDTO()),
      badExamples: rule.badExamples.map((ex) => ex.toDTO()),
      authorId: rule.authorId,
      createdAt: rule.createdAt.getTime(),
      updatedAt: rule.updatedAt.getTime(),
    };
  }
}
