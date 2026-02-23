export const RuleStatusValues = ['draft', 'active', 'deprecated'] as const;
export type RuleStatus = (typeof RuleStatusValues)[number];

export const RuleSeverityValues = ['mandatory', 'recommended'] as const;
export type RuleSeverity = (typeof RuleSeverityValues)[number];

export const RuleExampleTypeValues = ['good', 'bad'] as const;
export type RuleExampleType = (typeof RuleExampleTypeValues)[number];
