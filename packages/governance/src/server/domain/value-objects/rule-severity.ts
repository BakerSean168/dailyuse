/**
 * RuleSeverity 值对象 — Const Object 枚举模式
 *
 * 【规范说明：Const Object 枚举 - 参考 governance 活文档】
 *
 * 规则严重级别：决定规则的强制力度
 * - Mandatory（强制执行）：必须遵守，违反视为缺陷
 * - Recommended（推荐遵守）：建议遵守，允许合理例外
 *
 * 【业务约束】
 * - Mandatory 规则不能直接废弃，必须先降级为 Recommended
 *   （参见 RuleStatus.canTransitionTo 中的约束）
 * - 严格度比较：Mandatory > Recommended
 *
 * 【DDD 模式示范】
 * ✅ Branded Type：利用 `unique symbol` 防止原始字符串误用
 * ✅ Const Object 模式：替代 TypeScript enum，获得更好的 Tree-shaking 和类型安全
 * ✅ Result<T> 模式：工厂方法返回 Result，而非抛异常
 * ✅ 比较逻辑封装：`isStricterThan()` 将严格度比较逻辑封装在值对象中
 *
 * @see {@link RuleStatus} 状态机中对 Mandatory 废弃的约束
 */

import type { RuleSeverity as IRuleSeverity } from '@dailyuse/contracts/governance';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/** Branded type —— 编译时防止与普通字符串混用 */
export type RuleSeverity = IRuleSeverity & { readonly __brand: unique symbol };

/** 全部合法严重级别 */
const VALUES: IRuleSeverity[] = ['Mandatory', 'Recommended'];

/**
 * RuleSeverity 逻辑对象
 *
 * 提供工厂方法 (`create`)、判断辅助 (`isMandatory` / `isRecommended`)
 * 以及严格度比较 (`isStricterThan`)。
 */
export const RuleSeverity = {
  /** 强制执行级别 */
  Mandatory: 'Mandatory' as RuleSeverity,
  /** 推荐遵守级别 */
  Recommended: 'Recommended' as RuleSeverity,

  /**
   * 工厂方法 —— 从原始字符串创建 RuleSeverity（带校验）
   */
  create(value: string): Result<RuleSeverity> {
    if (!this.isValid(value)) {
      return error(
        'VALIDATION_ERROR',
        `Invalid RuleSeverity: "${value}". Valid values: ${VALUES.join(', ')}`
      );
    }
    return ok(value as RuleSeverity);
  },

  /** 判断原始字符串是否为合法严重级别 */
  isValid(value: string): value is RuleSeverity {
    return VALUES.includes(value as IRuleSeverity);
  },

  /** 获取全部合法严重级别 */
  getAll(): RuleSeverity[] {
    return VALUES as RuleSeverity[];
  },

  /** 是否为强制执行级别 */
  isMandatory(severity: RuleSeverity): boolean {
    return severity === this.Mandatory;
  },

  /** 是否为推荐遵守级别 */
  isRecommended(severity: RuleSeverity): boolean {
    return severity === this.Recommended;
  },

  /**
   * 比较两个严重级别的严格度
   *
   * 严格度数值：Mandatory = 2, Recommended = 1
   * @returns true 如果 a 比 b 更严格
   */
  isStricterThan(a: RuleSeverity, b: RuleSeverity): boolean {
    const levels = { Mandatory: 2, Recommended: 1 };
    return levels[a as IRuleSeverity] > levels[b as IRuleSeverity];
  },
};

