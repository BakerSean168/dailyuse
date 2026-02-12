/**
 * Delete Rule Use Case
 * 删除规则用例
 */

import type { IRuleRepository } from '../../domain-server/repositories/i-rule-repository';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';
import type { DeleteRuleReq, DeleteRuleRes } from '@/contracts/api/rules';
import type { RuleId } from '@/contracts/primitives/ids';
import type { ExecutionContext } from './create-rule.use-case';

/**
 * Delete Rule Use Case
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
      return ruleResult as any;
    }

    if (ruleResult.data === null) {
      return error('NOT_FOUND', `Rule with ID '${req.id}' not found`);
    }

    const rule = ruleResult.data;

    // Hard delete if Draft without revisions
    if (rule.status === 'Draft') {
      const deleteResult = await this.ruleRepository.delete(rule.id);
      if (!deleteResult.ok) {
        return deleteResult as any;
      }

      return ok({ success: true });
    }

    // Soft delete for Active/Deprecated rules
    const reason = `Deleted by user ${cx.identityId}`;
    const deprecateResult = rule.deprecate(reason);
    if (!deprecateResult.ok) {
      // If already deprecated, treat as success
      if (rule.status === 'Deprecated') {
        return ok({ success: true });
      }
      return deprecateResult as any;
    }

    const saveResult = await this.ruleRepository.save(rule);
    if (!saveResult.ok) {
      return saveResult as any;
    }

    return ok({ success: true });
  }
}
