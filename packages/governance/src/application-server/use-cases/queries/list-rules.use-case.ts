/**
 * List Rules Use Case
 * 列出规则用例
 */

import type { IRuleRepository } from '@/domain-server/repositories/i-rule-repository';
import type { RuleFilter } from '@/domain-server/repositories/i-rule-repository';
import type { Rule } from '@/domain-server/aggregates/rule';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { ListRulesQuery, ListRulesRes } from '../../../contracts/api/rules';
import type { RuleClientDTO } from '../../../contracts/aggregates/rule-client';

/**
 * List Rules Use Case
 */
export class ListRulesUseCase {
  constructor(private readonly ruleRepository: IRuleRepository) {}

  /**
   * Execute: Lists rules with optional filters
   */
  async execute(req: ListRulesQuery): Promise<Result<ListRulesRes>> {
    // Build filter
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

    // Query repository
    const rulesResult = await this.ruleRepository.findAll(filter);
    if (!rulesResult.ok) {
      return error(rulesResult.error.code, rulesResult.error.message, rulesResult.error.details);
    }

    const rules = rulesResult.data;

    // Calculate pagination
    const total = rules.length;
    const page = req.page ?? 1;
    const pageSize = req.pageSize ?? 20;
    const offset = (page - 1) * pageSize;
    const paginatedRules = rules.slice(offset, offset + pageSize);

    // Map to DTOs
    const dtos = paginatedRules.map((rule) => this.toClientDTO(rule));

    return ok({
      items: dtos,
      total,
      page,
      pageSize,
    });
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
