/**
 * Get Rule Revisions Use Case
 * 获取规则修订记录用例
 */

import type { IRuleRevisionRepository } from '../../domain-server/repositories/i-rule-revision-repository';
import type { RuleRevision } from '../../domain-server/entities/rule-revision';
import { RuleId } from '../../domain-shared/value-objects/rule-id';
import type { Result } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { RuleRevisionServerDTO, GetRuleRevisionsQuery, GetRuleRevisionsRes } from '@/contracts';

/**
 * Get Rule Revisions Use Case
 */
export class GetRuleRevisionsUseCase {
  constructor(private readonly revisionRepository: IRuleRevisionRepository) {}

  /**
   * Execute: Gets revision history for a rule
   */
  async execute(query: GetRuleRevisionsQuery): Promise<Result<GetRuleRevisionsRes>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const offset = (page - 1) * pageSize;

    // Parse ruleId from string to RuleId
    const ruleId = RuleId.of(query.ruleId);

    // Fetch revisions from repository
    const revisionsResult = await this.revisionRepository.findByRuleId(ruleId);
    if (!revisionsResult.ok) {
      return revisionsResult as any;
    }

    const revisions = revisionsResult.data;
    const total = revisions.length;

    // Sort by revision number descending (newest first)
    const sorted = [...revisions].sort((a, b) => b.revisionNumber - a.revisionNumber);

    // Apply pagination
    const paginated = sorted.slice(offset, offset + pageSize);

    // Map to DTOs
    const dtos = paginated.map(revision => revision.toClientDTO());

    return ok({
      items: dtos,
      total,
      page,
      pageSize,
    });
  }
}
