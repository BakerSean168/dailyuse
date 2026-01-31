/**
 * 变更操作类型
 */
export const ChangeOperationType = {
  Create: 'Create',
  Update: 'Update',
  Delete: 'Delete',
  Restore: 'Restore',
} as const;

export type ChangeOperationType = (typeof ChangeOperationType)[keyof typeof ChangeOperationType];
