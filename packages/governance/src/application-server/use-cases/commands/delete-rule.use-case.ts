/**
 * Delete Rule Use Case
 * 删除规则用例
 */

import type { IRuleRepository } from '@/domain-server/repositories/i-rule-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
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
    // Fetch rule
    const ruleResult = await this.ruleRepository.findById(req.id as RuleId);
    if (!ruleResult.ok) {
      return error(ruleResult.error.code, ruleResult.error.message, ruleResult.error.details);
    }

    if (ruleResult.data === null) {
      return error('NOT_FOUND', `Rule with ID '${req.id}' not found`);
    }

    const rule = ruleResult.data;

    // Hard delete if Draft without revisions
    // TODO: Dispatch RuleDeletedEvent via event bus after hard delete.
    // The aggregate is destroyed so addDomainEvent() cannot be used here.
    // 待办：硬删除后通过事件总线发布 RuleDeletedEvent，聚合已销毁无法使用 addDomainEvent()。
    if (rule.status === RuleStatus.Draft) {
      const deleteResult = await this.ruleRepository.delete(rule.id);
      if (!deleteResult.ok) {
        return error(
          deleteResult.error.code,
          deleteResult.error.message,
          deleteResult.error.details,
        );
      }

      return ok({ success: true });
    }

    // Soft delete for Active/Deprecated rules
    const reason = `Deleted by user ${cx.identityId}`;
    const deprecateResult = rule.deprecate(reason);
    if (!deprecateResult.ok) {
      // If already deprecated, treat as success
      if (rule.status === RuleStatus.Deprecated) {
        return ok({ success: true });
      }
      return error(
        deprecateResult.error.code,
        deprecateResult.error.message,
        deprecateResult.error.details,
      );
    }

    const saveResult = await this.ruleRepository.save(rule);
    if (!saveResult.ok) {
      return error(saveResult.error.code, saveResult.error.message, saveResult.error.details);
    }

    return ok({ success: true });
  }
}
