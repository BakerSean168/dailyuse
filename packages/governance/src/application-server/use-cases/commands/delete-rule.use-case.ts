/**
 * Delete Rule Use Case
 * 删除规则用例
 */

import type { IRuleRepository } from '@/domain-server/repositories/i-rule-repository';
import type { Result } from '@dailyuse/contracts/result';
import { toResultErrorException, unwrapOrThrowError } from '@dailyuse/contracts/result';
import { resultify } from '@dailyuse/utils/result';
import type { DeleteRuleReq, DeleteRuleRes } from '../../../contracts/api/rules';
import type { RuleId } from '../../../contracts/primitives/ids';
import { RuleStatus } from '../../../contracts/value-objects/rule-status';
import type { ExecutionContext } from '../execution-context';

/**
 * Delete Rule Use Case.
 * 删除规则用例。
 */
export class DeleteRuleUseCase {
  constructor(private readonly ruleRepository: IRuleRepository) {}

  /**
   * Execute: Deletes rule (soft or hard delete based on state)
   *
   * @param req - Delete request with rule ID
   * @param cx - Execution context with identityId from auth middleware
   *
   * Hard delete: Draft rules without revisions
   * Soft delete: Active/Deprecated rules (via deprecate method)
   */
  async execute(req: DeleteRuleReq, cx: ExecutionContext): Promise<Result<DeleteRuleRes>> {
    return resultify(async () => {
      const rule = await this.ruleRepository.findById(req.id as RuleId);
      if (rule === null) {
        throw toResultErrorException(
          { code: 'NOT_FOUND', message: `Rule with ID '${req.id}' not found` },
          404,
        );
      }

      if (rule.status === RuleStatus.Draft) {
        await this.ruleRepository.delete(rule.id);
        return { success: true };
      }

      const reason = `Deleted by user ${cx.identityId}`;
      const deprecateResult = rule.deprecate(reason);
      if (!deprecateResult.ok) {
        if (rule.status === RuleStatus.Deprecated) {
          return { success: true };
        }
        unwrapOrThrowError(deprecateResult);
      }

      await this.ruleRepository.save(rule);
      return { success: true };
    }, 'Failed to delete rule');
  }
}
