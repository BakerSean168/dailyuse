/**
 * Update Rule Use Case
 * 更新规则用例
 */

import type { IRuleRepository } from '@/domain-server/repositories/i-rule-repository';
import type { IRuleRevisionRepository } from '@/domain-server/repositories/i-rule-revision-repository';
import { RuleRevision } from '@/domain-server/entities/rule-revision';
import type { Result } from '@dailyuse/contracts/result';
import { error } from '@dailyuse/contracts/result';
import { ok } from '@dailyuse/contracts/result';
import type { UpdateRuleReq, UpdateRuleRes } from '../../../contracts/api/rules';
import type { RuleId } from '../../../contracts/primitives/ids';
import type { ExecutionContext } from './create-rule.use-case';

/**
 * Update Rule Use Case.
 * 更新规则用例。
 */
export class UpdateRuleUseCase {
  constructor(
    private readonly ruleRepository: IRuleRepository,
    private readonly revisionRepository: IRuleRevisionRepository,
  ) {}

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
  async execute(
    ruleId: string,
    req: UpdateRuleReq,
    cx: ExecutionContext,
  ): Promise<Result<UpdateRuleRes>> {
    // Fetch rule
    const ruleResult = await this.ruleRepository.findById(ruleId as RuleId);
    if (!ruleResult.ok) {
      return error(ruleResult.error.code, ruleResult.error.message, ruleResult.error.details);
    }

    if (ruleResult.data === null) {
      return error('NOT_FOUND', `Rule with ID '${ruleId}' not found`);
    }

    const rule = ruleResult.data;

    const changedFields: string[] = [];
    const previousValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    if (req.title !== undefined) {
      changedFields.push('title');
      previousValues.title = rule.title;
      newValues.title = req.title;
    }
    if (req.description !== undefined) {
      changedFields.push('description');
      previousValues.description = rule.description;
      newValues.description = req.description;
    }
    if (req.tags !== undefined) {
      changedFields.push('tags');
      previousValues.tags = rule.tags.map((tag) => tag.toDTO());
      newValues.tags = req.tags;
    }
    if (req.liveReferenceLocation !== undefined) {
      changedFields.push('liveReferenceLocation');
      previousValues.liveReferenceLocation = rule.liveReferenceLocation;
      newValues.liveReferenceLocation = req.liveReferenceLocation;
    }

    // Update content via domain method (only if fields provided)
    if (changedFields.length > 0) {
      const updateResult = rule.update({
        title: req.title,
        description: req.description,
        tags: req.tags,
        liveReferenceLocation:
          req.liveReferenceLocation === null ? undefined : req.liveReferenceLocation,
      });

      if (!updateResult.ok) {
        return error(
          updateResult.error.code,
          updateResult.error.message,
          updateResult.error.details,
        );
      }
    }

    let saveResult;
    if (changedFields.length > 0) {
      const revisionCountResult = await this.revisionRepository.countByRuleId(rule.id);
      if (!revisionCountResult.ok) {
        return error(
          revisionCountResult.error.code,
          revisionCountResult.error.message,
          revisionCountResult.error.details,
        );
      }

      const revision = RuleRevision.create({
        ruleId: rule.id,
        revisionNumber: revisionCountResult.data + 1,
        authorId: cx.identityId,
        changedFields,
        previousValues,
        newValues,
        changeType: 'Updated',
      });

      if (!revision.ok) {
        return error(revision.error.code, revision.error.message, revision.error.details);
      }

      saveResult = await this.ruleRepository.saveWithRevision(rule, revision.data);
    } else {
      saveResult = await this.ruleRepository.save(rule);
    }

    if (!saveResult.ok) {
      return error(saveResult.error.code, saveResult.error.message, saveResult.error.details);
    }

    // Convert to ClientDTO and return
    return ok(rule.toClientDTO());
  }
}
