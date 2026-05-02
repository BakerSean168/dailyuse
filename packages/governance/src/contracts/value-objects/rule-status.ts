/**
 * RuleStatus - Lifecycle state of a Rule
 * 规则生命周期状态
 *
 * 【规范说明：const object 枚举模式】
 * 使用 `as const` 对象 + 联合类型推导，而非 TypeScript enum。
 * 原因：
 * 1. const object 天然 tree-shakeable，不会生成额外运行时代码
 * 2. 推导出的联合类型（'Draft' | 'Active' | 'Deprecated'）可直接用于类型收窄
 * 3. 与 JSON/数据库天然兼容，无需序列化转换
 * 4. 支持 typeof + keyof typeof 一行推导，零冗余
 *
 * 参见：docs/standards/值对象可以是type.md
 * 参见：docs/standards/枚举与常量对象规范(Enum&Constant-Objects).md
 *
 * 【使用示例】
 * ```ts
 * if (rule.status === RuleStatus.Draft) { ... }
 * const allStatuses = Object.values(RuleStatus); // ['Draft', 'Active', 'Deprecated']
 * ```
 */
export const RuleStatus = {
  Draft: 'Draft',
  Active: 'Active',
  Deprecated: 'Deprecated',
} as const;

export type RuleStatus = typeof RuleStatus[keyof typeof RuleStatus];
