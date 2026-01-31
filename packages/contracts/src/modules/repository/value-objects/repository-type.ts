/**
 * 仓储类型
 */
export const RepositoryType = {
  Markdown: 'Markdown',
  Code: 'Code',
  Mixed: 'Mixed',
} as const;

export type RepositoryType = (typeof RepositoryType)[keyof typeof RepositoryType];
