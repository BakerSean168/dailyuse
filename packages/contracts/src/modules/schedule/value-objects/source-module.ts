/**
 * 来源模块
 */
export const SourceModule = {
  Reminder: 'Reminder', // Reminder 模块
  Task: 'Task', // Task 模块
  Goal: 'Goal', // Goal 模块
  Notification: 'Notification', // Notification 模块
  System: 'System', // System 系统任务
  Custom: 'Custom', // Custom 自定义模块
} as const;

export type SourceModule = (typeof SourceModule)[keyof typeof SourceModule];
