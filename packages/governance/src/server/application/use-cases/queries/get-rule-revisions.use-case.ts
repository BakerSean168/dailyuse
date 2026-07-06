/**
 * Get Rule Revisions Use Case
 * 获取规则修订记录用例
 */

import type { IRuleRevisionRepository } from '@/server/domain/repositories/i-rule-revision-repository';
import { RuleId } from '@/server/domain/value-objects/rule-id';
import type { Result } from '@dailyuse/contracts/result';
import { resultify } from '@dailyuse/utils/result';
import type {
  GetRuleRevisionsQuery,
  GetRuleRevisionsRes,
} from '@dailyuse/contracts/governance';

/**
 * Get Rule Revisions Use Case.
 * 获取规则修订记录用例。
  * @param private readonly revisionRepository - 
 */
export class GetRuleRevisionsUseCase {
  constructor(private readonly revisionRepository: IRuleRevisionRepository) {}

  /**
   * Execute: Gets revision history for a rule
   */
  async execute(query: GetRuleRevisionsQuery): Promise<Result<GetRuleRevisionsRes>> {
    return resultify(async () => {
      const page = query.page ?? 1;
      const pageSize = query.pageSize ?? 20;
      const offset = (page - 1) * pageSize;
      const revisions = await this.revisionRepository.findByRuleId(RuleId.of(query.ruleId));
      const total = revisions.length;
      const paginated = [...revisions]
        .sort((a, b) => b.revisionNumber - a.revisionNumber)
        .slice(offset, offset + pageSize);

      return {
        items: paginated.map((revision) => revision.toClientDTO()),
        total,
        page,
        pageSize,
      };
    }, 'Failed to get rule revisions');
  }
}

