/**
 * ChangeType - Type of change recorded in a RuleRevision.
 * 变更类型 — 记录在 RuleRevision 中的变更种类。
 *
 * Uses const object pattern (not TypeScript enum) per constitution.
 * 按照规范使用 const 对象模式（非 TypeScript enum）。
 */
export const ChangeType = {
  Created: 'Created',
  Updated: 'Updated',
  Deprecated: 'Deprecated',
  Reactivated: 'Reactivated',
} as const;

export type ChangeType = (typeof ChangeType)[keyof typeof ChangeType];
