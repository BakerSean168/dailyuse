/**
 * Get Rule
 *
 * 获取规则用例
 */

import type { Result } from '@dailyuse/contracts/result';
import type { GetRuleReq } from '@/contracts/api/rules';
import { Rule } from '../../domain-client/aggregates/rule';
import type { IRuleApiClient } from '@/contracts/api/rule-api-client.port';

/**
 * Get Rule
 */
export class GetRule {
  private static instance: GetRule;

  private constructor(private readonly apiClient: IRuleApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient: IRuleApiClient): GetRule {
    GetRule.instance = new GetRule(apiClient);
    return GetRule.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(apiClient?: IRuleApiClient): GetRule {
    if (!GetRule.instance) {
      if (!apiClient) {
        throw new Error('GetRule: API client is required for initial instance creation');
      }
      GetRule.instance = GetRule.createInstance(apiClient);
    }
    return GetRule.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    GetRule.instance = undefined as unknown as GetRule;
  }

  /**
   * 执行用例：通过 ID 或 code 获取规则
   */
  async execute(req: GetRuleReq): Promise<Result<Rule>> {
    const result = await this.apiClient.getRule(req);
    if (!result.ok) return result;
    return { ok: true, data: Rule.fromDTO(result.data) };
  }
}
