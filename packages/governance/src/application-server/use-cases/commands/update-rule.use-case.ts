/**
 * Update Rule Use Case
 * 更新规则用例
 */

import type { IRuleRepository } from '@/domain-server/repositories/i-rule-repository';
import type { IRuleRevisionRepository } from '@/domain-server/repositories/i-rule-revision-repository';
import { RuleRevision } from '@/domain-server/entities/rule-revision';
import { ChangeType } from '@/domain-shared/value-objects/change-type';
import type { Result } from '@dailyuse/contracts/result';
import { toResultErrorException, unwrapOrThrowError } from '@dailyuse/contracts/result';
import { resultify } from '@dailyuse/utils/result';
import type { UpdateRuleReq, UpdateRuleRes } from '../../../contracts/api/rules';
import type { RuleId } from '../../../contracts/primitives/ids';
import type { ExecutionContext } from '../execution-context';

/**
 * Update Rule Use Case.
 * 更新规则用例。
  * @param private readonly ruleRepository - 
  * @param private readonly revisionRepository - 
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
    return resultify(async () => {
      const rule = await this.ruleRepository.findById(ruleId as RuleId);
      if (rule === null) {
        throw toResultErrorException(
          { code: 'NOT_FOUND', message: `Rule with ID '${ruleId}' not found` },
          404,
        );
      }

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

      if (changedFields.length > 0) {
        unwrapOrThrowError(
          rule.update({
            title: req.title,
            description: req.description,
            tags: req.tags,
            liveReferenceLocation:
              req.liveReferenceLocation === null ? undefined : req.liveReferenceLocation,
          }),
        );
      }

      if (changedFields.length > 0) {
        const revisionCount = await this.revisionRepository.countByRuleId(rule.id);
        const revision = unwrapOrThrowError(
          RuleRevision.create({
            ruleId: rule.id,
            revisionNumber: revisionCount + 1,
            authorId: cx.identityId,
            changedFields,
            previousValues,
            newValues,
            changeType: ChangeType.Updated,
          }),
        );

        await this.ruleRepository.saveWithRevision(rule, revision);
      } else {
        await this.ruleRepository.save(rule);
      }

      return rule.toClientDTO();
    }, 'Failed to update rule');
  }
}
