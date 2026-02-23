/**
 * RuleStatus 值对象 — Const Object 枚举模式
 *
 * 【规范说明：Const Object 枚举 - 参考 governance 活文档】
 *
 * 规则状态：控制 Rule 聚合根的生命周期流转
 * - Draft（草稿）：新建规则的初始状态，可编辑但未生效
 * - Active（生效）：规则已发布并强制执行
 * - Deprecated（已废弃）：规则不再适用，保留审计记录
 *
 * 【状态机转换规则】
 *   Draft ──▶ Active       （激活）
 *   Active ──▶ Deprecated  （废弃，仅限 Recommended 严重级别）
 *   Deprecated ──▶ Active  （重新激活）
 *   Draft ──▶ Deprecated   ❌ 禁止（草稿必须先激活）
 *
 * 【DDD 模式示范】
 * ✅ Branded Type：利用 `unique symbol` 防止原始字符串误用
 * ✅ Const Object 模式：替代 TypeScript enum，获得更好的 Tree-shaking 和类型安全
 * ✅ Result<T> 模式：所有校验和状态转换返回 Result，而非抛异常
 * ✅ 状态机封装：`canTransitionTo()` 集中管理转换规则与业务约束
 *
 * @see {@link Rule} 聚合根中的 `activate()` / `deprecate()` / `reactivate()` 方法
 * @see {@link RuleSeverity} 严重级别对废弃操作的约束
 */

import type { RuleStatus as IRuleStatus } from '../../contracts/value-objects/rule-status';
import { RuleSeverity } from './rule-severity';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/** Branded type —— 编译时防止与普通字符串混用 */
export type RuleStatus = IRuleStatus & { readonly __brand: unique symbol };

/** 全部合法状态值 */
const VALUES: IRuleStatus[] = ['Draft', 'Active', 'Deprecated'];

/**
 * RuleStatus 逻辑对象
 *
 * 提供工厂方法 (`create`)、状态判断辅助 (`isDraft` / `isActive` / `isDeprecated`)
 * 以及核心的状态机校验 (`canTransitionTo`)。
 */
export const RuleStatus = {
  /** 草稿状态 */
  Draft: 'Draft' as RuleStatus,
  /** 生效状态 */
  Active: 'Active' as RuleStatus,
  /** 已废弃状态 */
  Deprecated: 'Deprecated' as RuleStatus,

  /**
   * 工厂方法 —— 从原始字符串创建 RuleStatus（带校验）
   */
  create(value: string): Result<RuleStatus> {
    if (!this.isValid(value)) {
      return error(
        'VALIDATION_ERROR',
        `Invalid RuleStatus: "${value}". Valid values: ${VALUES.join(', ')}`
      );
    }
    return ok(value as RuleStatus);
  },

  /** 判断原始字符串是否为合法状态值 */
  isValid(value: string): value is RuleStatus {
    return VALUES.includes(value as IRuleStatus);
  },

  /** 获取全部合法状态值 */
  getAll(): RuleStatus[] {
    return VALUES as RuleStatus[];
  },

  /** 是否为草稿 */
  isDraft(status: RuleStatus): boolean {
    return status === this.Draft;
  },

  /** 是否为生效 */
  isActive(status: RuleStatus): boolean {
    return status === this.Active;
  },

  /** 是否为已废弃 */
  isDeprecated(status: RuleStatus): boolean {
    return status === this.Deprecated;
  },

  /** 是否为终态（当前仅 Deprecated 为终态） */
  isTerminal(status: RuleStatus): boolean {
    return this.isDeprecated(status);
  },

  /**
   * 状态机核心 —— 判断是否允许从 `from` 转换到 `to`
   *
   * 业务约束：
   * - Mandatory 规则不能直接废弃，必须先降级为 Recommended
   *
   * @param from    当前状态
   * @param to      目标状态
   * @param context 可选上下文（携带 severity 用于约束判断）
   * @returns Result<true> 成功或携带错误原因
   */
  canTransitionTo(
    from: RuleStatus,
    to: RuleStatus,
    context?: { severity?: RuleSeverity }
  ): Result<true> {
    if (from === to) return ok(true);

    /** 合法转换矩阵 */
    const validTransitions: Record<IRuleStatus, Set<IRuleStatus>> = {
      'Draft': new Set(['Active']),
      'Active': new Set(['Deprecated']),
      'Deprecated': new Set(['Active']),
    };

    const allowedTargets = validTransitions[from as IRuleStatus];
    if (!allowedTargets?.has(to as IRuleStatus)) {
      const validList = Array.from(allowedTargets || []).join(', ') || 'none';
      return error(
        'BUSINESS_ERROR',
        `Cannot transition from ${from} to ${to}. Valid: ${validList}`
      );
    }

    // 业务约束：Mandatory 规则不能直接废弃
    if (from === this.Active && to === this.Deprecated) {
      if (context?.severity === RuleSeverity.Mandatory) {
        return error(
          'BUSINESS_ERROR',
          'Cannot deprecate MANDATORY rule. Downgrade to RECOMMENDED first.'
        );
      }
    }

    return ok(true);
  },
};
