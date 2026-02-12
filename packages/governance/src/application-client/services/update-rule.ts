/**
 * Update Rule
 *
 * 更新规则用例
 */

import type { UpdateRuleReq, UpdateRuleRes } from '@/contracts/api/rules';
import { Rule } from '../../domain-client/aggregates/rule';
import type { IRuleApiClient } from '@/contracts/api/rule-api-client.port';

/**
 * Update Rule
 */
export class UpdateRule {
  private static instance: UpdateRule;

  private constructor(private readonly apiClient: IRuleApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient: IRuleApiClient): UpdateRule {
    UpdateRule.instance = new UpdateRule(apiClient);
    return UpdateRule.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(apiClient?: IRuleApiClient): UpdateRule {
    if (!UpdateRule.instance) {
      if (!apiClient) {
        throw new Error('UpdateRule: API client is required for initial instance creation');
      }
      UpdateRule.instance = UpdateRule.createInstance(apiClient);
    }
    return UpdateRule.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    UpdateRule.instance = undefined as unknown as UpdateRule;
  }

  /**
   * 执行用例：更新规则
   */
  async execute(ruleId: string, req: UpdateRuleReq): Promise<Rule> {
    const data = await this.apiClient.updateRule(ruleId, req);
    return Rule.fromDTO(data);
  }
}
