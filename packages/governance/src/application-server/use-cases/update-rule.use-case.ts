/**
 * Update Rule Use Case
 * 更新规则用例
 */

import type { IRuleRepository } from '../../domain-server/repositories/i-rule-repository';
import type { Result } from '@dailyuse/contracts/result';
import { error } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { UpdateRuleReq, UpdateRuleRes } from '@/contracts/api';
import type { RuleClientDTO } from '@/contracts/aggregates';
import type { RuleId } from '@/contracts';
import type { ExecutionContext } from './create-rule.use-case';

/**
 * Update Rule Use Case
 */
export class UpdateRuleUseCase {
  constructor(private readonly ruleRepository: IRuleRepository) {}

  /**
   * Execute: Updates existing rule content
   * 
   * @param ruleId - Rule ID from URL path parameter
   * @param req - Update request body (PATCH semantics)
   * @param cx - Execution context with identityId from auth middleware
   * 
   * Flow:
   * 1. Fetch rule by ID
   * 2. Call domain methods to update
   * 3. Persist changes
   * 4. Return updated RuleClientDTO
   */
  async execute(ruleId: string, req: UpdateRuleReq, cx: ExecutionContext): Promise<Result<UpdateRuleRes>> {
    // Fetch rule
    const ruleResult = await this.ruleRepository.findById(ruleId as RuleId);
    if (!ruleResult.ok) {
      return ruleResult as any;
    }

    if (ruleResult.data === null) {
      return error('NOT_FOUND', `Rule with ID '${ruleId}' not found`);
    }

    const rule = ruleResult.data;

    // Update content via domain method (only if fields provided)
    if (req.title || req.description || req.tags || req.liveReferenceLocation !== undefined) {
      const updateResult = rule.update({
        title: req.title,
        description: req.description,
        tags: req.tags,
        liveReferenceLocation: req.liveReferenceLocation === null ? undefined : req.liveReferenceLocation,
      });

      if (!updateResult.ok) {
        return updateResult as any;
      }
    }

    // Persist changes
    const saveResult = await this.ruleRepository.save(rule);
    if (!saveResult.ok) {
      return saveResult as any;
    }

    // Convert to ClientDTO and return
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
