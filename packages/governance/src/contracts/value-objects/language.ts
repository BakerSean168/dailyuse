/**
 * Language - Supported programming languages for code snippets
 * 
 * Uses const object pattern (not TypeScript enum) per constitution
  *
 * ${rel} — governance module source.
 *
 * 中文：自动补充说明。
 */
export const Language = {
  TypeScript: 'TypeScript',
  JSON: 'JSON',
  YAML: 'YAML',
  Prisma: 'Prisma',
} as const;

export type Language = typeof Language[keyof typeof Language];
