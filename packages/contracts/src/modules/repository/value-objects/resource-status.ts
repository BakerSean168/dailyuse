/**
 * 资源状态
 */
export const ResourceStatus = {
  Active: 'Active',
  Archived: 'Archived',
  Deleted: 'Deleted',
  Draft: 'Draft',
} as const;

export type ResourceStatus = (typeof ResourceStatus)[keyof typeof ResourceStatus];
