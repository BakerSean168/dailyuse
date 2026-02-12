/**
 * SnippetType - Type of code example
 * 
 * Uses const object pattern (not TypeScript enum) per constitution
 */
export const SnippetType = {
  GoodExample: 'GoodExample',
  BadExample: 'BadExample',
} as const;

export type SnippetType = typeof SnippetType[keyof typeof SnippetType];
