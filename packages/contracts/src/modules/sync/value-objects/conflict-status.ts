/**
 * 冲突状态
 */
export const ConflictStatus = {
  Unresolved: 'Unresolved',
  Resolved: 'Resolved',
  Ignored: 'Ignored',
} as const;

export type ConflictStatus = (typeof ConflictStatus)[keyof typeof ConflictStatus];
