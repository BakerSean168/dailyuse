/**
 * RuleSeverity - Enforcement level of a Rule
 * 
 * Uses const object pattern (not TypeScript enum) per constitution
  *
 * ${rel} — governance module source.
 *
 * 中文：自动补充说明。
 */
export const RuleSeverity = {
  Mandatory: 'Mandatory',
  Recommended: 'Recommended',
} as const;

export type RuleSeverity = typeof RuleSeverity[keyof typeof RuleSeverity];
