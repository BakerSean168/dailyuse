/**
 * Search Rules Use Case
 * 搜索规则用例
 */

import type { IRuleRepository, RuleFilter } from '@/domain-server/repositories/i-rule-repository';
import type { Rule } from '@/domain-server/aggregates/rule';
import type { Result } from '@dailyuse/contracts/result';
import { toResultErrorException } from '@dailyuse/contracts/result';
import { resultify } from '@dailyuse/utils/result';
import type { SearchRulesQueryInput, SearchRulesRes } from '../../../contracts/api/rules';
import { RuleStatus } from '../../../contracts/value-objects/rule-status';
import type { ExecutionContext } from '../execution-context';

/**
 * Search Rules Use Case.
 * 搜索规则用例。
  * @param private readonly ruleRepository - 
 */
export class SearchRulesUseCase {
  constructor(private readonly ruleRepository: IRuleRepository) {}

  /**
   * Execute: Search with relevance scoring and status weighting.
   * 执行：带有相关性评分和状态权重的搜索。
   *
   * Relevance priority:
   * - title exact > title partial > code > description > tags
   *
   * Status weight:
   * - Active > Draft > Deprecated
   */
  async execute(
    req: SearchRulesQueryInput,
    _cx?: ExecutionContext,
  ): Promise<Result<SearchRulesRes>> {
    return resultify(async () => {
      const startedAt = Date.now();
      const normalizedQuery = req.query.trim();
      if (normalizedQuery.length === 0) {
        throw toResultErrorException(
          { code: 'VALIDATION_ERROR', message: 'Search query cannot be empty' },
          422,
        );
      }

      const filter: RuleFilter = {};
      if (req.status) {
        filter.status = req.status;
      }
      if (req.severity) {
        filter.severity = req.severity;
      }
      if (req.tags) {
        filter.tags = req.tags;
      }

      const scoredRules = (await this.ruleRepository.search(normalizedQuery, filter))
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
      const page = req.page ?? 1;
      const pageSize = req.pageSize ?? 20;
      const offset = (page - 1) * pageSize;

      return {
        items: scoredRules
          .slice(offset, offset + pageSize)
          .map(({ rule }) => rule.toClientDTO()),
        total,
        page,
        pageSize,
        searchTime: Date.now() - startedAt,
      };
    }, 'Failed to search rules');
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

  private statusWeight(status: RuleStatus): number {
    if (status === RuleStatus.Active) return 15;
    if (status === RuleStatus.Draft) return 10;
    if (status === RuleStatus.Deprecated) return 5;
    return 0;
  }
}
