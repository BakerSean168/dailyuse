/**
 * List Rules Use Case
 * 列出规则用例
 */

import type { IRuleRepository } from '../../../domain/repositories/i-rule-repository';
import type { RuleFilter } from '../../../domain/repositories/i-rule-repository';
import type { Result } from '@memoflow/contracts/result';
import { resultify } from '@memoflow/utils/result';
import type { ListRulesQuery, ListRulesRes } from '@memoflow/contracts/governance';

/**
 * List Rules Use Case.
 * 列出规则用例。
  * @param private readonly ruleRepository - 
 */
export class ListRulesUseCase {
  constructor(private readonly ruleRepository: IRuleRepository) {}

  /**
   * Execute: Lists rules with optional filters
   */
  async execute(req: ListRulesQuery): Promise<Result<ListRulesRes>> {
    return resultify(async () => {
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

      const rules = await this.ruleRepository.findAll(filter);
      const total = rules.length;
      const page = req.page ?? 1;
      const pageSize = req.pageSize ?? 20;
      const offset = (page - 1) * pageSize;
      const paginatedRules = rules.slice(offset, offset + pageSize);

      return {
        items: paginatedRules.map((rule) => rule.toClientDTO()),
        total,
        page,
        pageSize,
      };
    }, 'Failed to list rules');
  }
}

