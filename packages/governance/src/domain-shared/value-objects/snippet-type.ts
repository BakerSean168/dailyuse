/**
 * SnippetType 值对象 — Const Object 枚举模式
 *
 * 【规范说明：Const Object 枚举 - 参考 governance 活文档】
 *
 * 代码片段类型：区分正面示例和反面示例
 * - GoodExample（正面示例）：推荐的做法，应该遵循
 * - BadExample（反面示例）：需要避免的做法
 *
 * 【业务规则】
 * 每条 Rule 至少需要 1 个 GoodExample + 1 个 BadExample
 * （参见 Rule.create() 和 Rule.removeCodeSnippet() 中的校验）
 *
 * 【DDD 模式示范】
 * ✅ Branded Type：利用 `unique symbol` 防止原始字符串误用
 * ✅ Const Object 模式：替代 TypeScript enum
 * ✅ Result<T> 模式：工厂方法返回 Result，而非抛异常
 *
 * @see {@link CodeSnippet} 使用 SnippetType 标注片段类型
 * @see {@link Rule} 聚合根中对 GoodExample / BadExample 数量的约束
 */

import type { SnippetType as ISnippetType } from '../../contracts/value-objects/snippet-type';
import type { Result } from '@dailyuse/contracts/result';
import { ok, error } from '@dailyuse/contracts/result';

/** Branded type —— 编译时防止与普通字符串混用 */
export type SnippetType = ISnippetType & { readonly __brand: unique symbol };

/** 全部合法片段类型 */
const VALUES: ISnippetType[] = ['GoodExample', 'BadExample'];

/**
 * SnippetType 逻辑对象
 *
 * 提供工厂方法 (`create`)、校验 (`isValid`) 和枚举列举 (`getAll`)。
 */
export const SnippetType = {
  /** 正面示例 —— 推荐做法 */
  GoodExample: 'GoodExample' as SnippetType,
  /** 反面示例 —— 应避免的做法 */
  BadExample: 'BadExample' as SnippetType,

  /**
   * 工厂方法 —— 从原始字符串创建 SnippetType（带校验）
   */
  create(value: string): Result<SnippetType> {
    if (!this.isValid(value)) {
      return error(
        'VALIDATION_ERROR',
        `Invalid SnippetType: "${value}". Valid values: ${VALUES.join(', ')}`,
      );
    }

    return ok(value as SnippetType);
  },

  /** 判断原始字符串是否为合法片段类型 */
  isValid(value: string): value is SnippetType {
    return VALUES.includes(value as ISnippetType);
  },

  /** 获取全部合法片段类型 */
  getAll(): SnippetType[] {
    return VALUES as SnippetType[];
  },
};
