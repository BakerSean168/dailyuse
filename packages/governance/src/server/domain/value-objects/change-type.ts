/**
 * ChangeType Value Object — Const Object Enum Pattern.
 * 变更类型值对象 — Const 对象枚举模式。
 *
 * Records the kind of change captured in a RuleRevision:
 * 记录 RuleRevision 中捕获的变更种类：
 * - Created: Initial creation of the rule 规则的初始创建
 * - Updated: Modification of rule fields 修改规则字段
 * - Deprecated: Rule marked as deprecated 规则标记为废弃
 * - Reactivated: Deprecated rule restored to active 废弃规则恢复为生效
 *
 * Uses branded type to prevent accidental mixing with raw strings.
 * 使用品牌类型防止与原始字符串意外混用。
 */

import type { ChangeType as IChangeType } from '@dailyuse/contracts/governance';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/** Branded type — compile-time guard against plain string misuse. 品牌类型 — 编译时防止与普通字符串混用。 */
export type ChangeType = IChangeType & { readonly __brand: unique symbol };

/** All valid change-type values. 全部合法变更类型值。 */
const VALUES: IChangeType[] = ['Created', 'Updated', 'Deprecated', 'Reactivated'];

/**
 * ChangeType logic object.
 * 变更类型逻辑对象。
 *
 * Provides factory method (`create`), validation (`isValid`), enumeration (`getAll`),
 * and display helpers.
 * 提供工厂方法 (`create`)、校验 (`isValid`)、枚举 (`getAll`) 和显示辅助方法。
 */
export const ChangeType = {
  /** Initial creation. 初始创建。 */
  Created: 'Created' as ChangeType,
  /** Field modification. 字段修改。 */
  Updated: 'Updated' as ChangeType,
  /** Marked as deprecated. 标记为废弃。 */
  Deprecated: 'Deprecated' as ChangeType,
  /** Restored from deprecated. 从废弃恢复。 */
  Reactivated: 'Reactivated' as ChangeType,

  /**
   * Factory method — creates a ChangeType from a raw string (with validation).
   * 工厂方法 — 从原始字符串创建 ChangeType（带校验）。
   */
  create(value: string): Result<ChangeType> {
    if (!this.isValid(value)) {
      return error(
        'VALIDATION_ERROR',
        `Invalid ChangeType: "${value}". Valid values: ${VALUES.join(', ')}`,
      );
    }
    return ok(value as ChangeType);
  },

  /** Checks whether a raw string is a valid change-type value. 判断原始字符串是否为合法变更类型值。 */
  isValid(value: string): value is ChangeType {
    return VALUES.includes(value as IChangeType);
  },

  /** Returns all valid change-type values. 获取全部合法变更类型值。 */
  getAll(): ChangeType[] {
    return VALUES as ChangeType[];
  },

  /** Display label map (Chinese). 中文显示标签映射。 */
  getDisplayLabel(type: ChangeType): string {
    const labelMap: Record<IChangeType, string> = {
      Created: '新建',
      Updated: '已更新',
      Deprecated: '已废弃',
      Reactivated: '重新激活',
    };
    return labelMap[type as IChangeType];
  },
};

