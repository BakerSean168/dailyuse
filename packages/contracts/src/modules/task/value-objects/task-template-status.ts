/**
 * 任务模板状态
 */
export const TaskTemplateStatus = {
  Active: 'Active', // 激活
  Paused: 'Paused', // 暂停
  Archived: 'Archived', // 归档
  Deleted: 'Deleted', // 删除
} as const;

export type TaskTemplateStatus = (typeof TaskTemplateStatus)[keyof typeof TaskTemplateStatus];
