/**
 * Get Rule Use Case
 * 获取规则用例
 */

import type { IRuleRepository } from '@/domain-server/repositories/i-rule-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { GetRuleReq, GetRuleRes } from '@/contracts/api/rules';
import type { RuleClientDTO } from '@/contracts/aggregates/rule-client';
import type { RuleId } from '@/contracts/primitives/ids';

/**
 * Get Rule Use Case
 */
export class GetRuleUseCase {
  constructor(private readonly ruleRepository: IRuleRepository) {}

  /**
   * Execute: Retrieves single rule by ID or code
   */
  async execute(req: GetRuleReq): Promise<Result<GetRuleRes>> {
    let ruleResult;
    
    if (req.id) {
      ruleResult = await this.ruleRepository.findById(req.id as RuleId);
    } else if (req.code) {
      ruleResult = await this.ruleRepository.findByCode(req.code);
    } else {
      return error('BAD_REQUEST', 'Must provide either id or code');
    }

    if (!ruleResult.ok) {
      return error(ruleResult.error.code, ruleResult.error.message, ruleResult.error.details);
    }

    if (ruleResult.data === null) {
      const identifier = req.id ? `ID '${req.id}'` : `code '${req.code}'`;
      return error('NOT_FOUND', `Rule with ${identifier} not found`);
    }

    const rule = ruleResult.data;
    
    // Convert to ClientDTO
    const dto: RuleClientDTO = {
      id: rule.id,
      code: rule.code,
      title: rule.title,
      description: rule.description,
      severity: rule.severity,
      status: rule.status,
      deprecationReason: rule.deprecationReason,
      replacementRuleId: rule.replacementRuleId,
      liveReferenceLocation: rule.liveReferenceLocation,
      tags: rule.tags.map(tag => tag.toDTO()),
      goodExamples: rule.goodExamples.map(ex => ex.toDTO()),
      badExamples: rule.badExamples.map(ex => ex.toDTO()),
      authorId: rule.authorId,
      createdAt: rule.createdAt.getTime(),
      updatedAt: rule.updatedAt.getTime(),
    };

    return ok(dto);
  }
}
