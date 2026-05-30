/**
 * SnippetType - Type of code example
 * 
 * Uses const object pattern (not TypeScript enum) per constitution
  *
 * ${rel} — governance module source.
 *
 * 中文：自动补充说明。
 */
export const SnippetType = {
  GoodExample: 'GoodExample',
  BadExample: 'BadExample',
} as const;

export type SnippetType = typeof SnippetType[keyof typeof SnippetType];
