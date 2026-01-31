/**
 * 版本变更类型枚举
 */
export const VersionChangeType = {
  Create: 'Create',
  Edit: 'Edit',
  Delete: 'Delete',
  Rename: 'Rename',
  Move: 'Move',
  Merge: 'Merge',
  Restore: 'Restore',
} as const;

export type VersionChangeType = (typeof VersionChangeType)[keyof typeof VersionChangeType];
