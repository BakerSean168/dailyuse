/**
 * Get Rule Use Case
 * 获取规则用例
 */

import type { IRuleRepository } from '@/domain-server/repositories/i-rule-repository';
import type { Result } from '@dailyuse/contracts/result';
import { toResultErrorException } from '@dailyuse/contracts/result';
import { resultify } from '@dailyuse/utils/result';
import type { GetRuleReq, GetRuleRes } from '../../../contracts/api/rules';
import type { RuleId } from '../../../contracts/primitives/ids';

/**
 * Get Rule Use Case.
 * 获取规则用例。
 */
export class GetRuleUseCase {
  constructor(private readonly ruleRepository: IRuleRepository) {}

  /**
   * Execute: Retrieves single rule by ID or code
   */
  async execute(req: GetRuleReq): Promise<Result<GetRuleRes>> {
    return resultify(async () => {
      let rule = null;

      if (req.id) {
        rule = await this.ruleRepository.findById(req.id as RuleId);
      } else if (req.code) {
        rule = await this.ruleRepository.findByCode(req.code);
      } else {
        throw toResultErrorException(
          { code: 'BAD_REQUEST', message: 'Must provide either id or code' },
          400,
        );
      }

      if (rule === null) {
        const identifier = req.id ? `ID '${req.id}'` : `code '${req.code}'`;
        throw toResultErrorException(
          { code: 'NOT_FOUND', message: `Rule with ${identifier} not found` },
          404,
        );
      }

      return rule.toClientDTO();
    }, 'Failed to get rule');
  }
}
