// Governance Module Value Objects - Type Definitions
// These are CONTRACT-LEVEL types. Implementations live in domain-shared.

/**
 * Rule ID branded type placeholder
 * Actual implementation uses createIdType utility in domain-shared
 */
export type RuleId = string & { __brand: 'RuleId' };

/**
 * User ID branded type placeholder
 * Imported from shared auth contracts in real implementation
 */
export type UserId = string & { __brand: 'UserId' };

/**
 * Rule Status enum
 * Lifecycle states: Draft → Active ↔ Deprecated
 */
export const RuleStatus = {
  Draft: 'Draft',
  Active: 'Active',
  Deprecated: 'Deprecated',
} as const;

export type RuleStatus = typeof RuleStatus[keyof typeof RuleStatus];

/**
 * Rule Severity enum
 * Enforcement level: Mandatory (strict) vs Recommended (advisory)
 */
export const RuleSeverity = {
  Mandatory: 'Mandatory',
  Recommended: 'Recommended',
} as const;

export type RuleSeverity = typeof RuleSeverity[keyof typeof RuleSeverity];

/**
 * Code Snippet Language enum
 * Supported syntax highlighting languages
 */
export const Language = {
  TypeScript: 'TypeScript',
  JSON: 'JSON',
  YAML: 'YAML',
  Prisma: 'Prisma',
} as const;

export type Language = typeof Language[keyof typeof Language];

/**
 * Code Snippet Type enum
 * Distinguishes good patterns from anti-patterns
 */
export const SnippetType = {
  GoodExample: 'GoodExample',
  BadExample: 'BadExample',
} as const;

export type SnippetType = typeof SnippetType[keyof typeof SnippetType];

/**
 * Rule Tag value type
 * Always normalized to lowercase-kebab-case
 */
export type RuleTag = string;
