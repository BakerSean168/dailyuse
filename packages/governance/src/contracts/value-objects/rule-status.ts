/**
 * RuleStatus - Lifecycle state of a Rule
 * 
 * Uses const object pattern (not TypeScript enum) per constitution
 */
export const RuleStatus = {
  Draft: 'Draft',
  Active: 'Active',
  Deprecated: 'Deprecated',
} as const;

export type RuleStatus = typeof RuleStatus[keyof typeof RuleStatus];
