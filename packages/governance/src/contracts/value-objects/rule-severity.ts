/**
 * RuleSeverity - Enforcement level of a Rule
 * 
 * Uses const object pattern (not TypeScript enum) per constitution
 */
export const RuleSeverity = {
  Mandatory: 'Mandatory',
  Recommended: 'Recommended',
} as const;

export type RuleSeverity = typeof RuleSeverity[keyof typeof RuleSeverity];
