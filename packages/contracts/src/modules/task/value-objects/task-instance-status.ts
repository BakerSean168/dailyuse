/**
 * 任务实例状态（循环任务的实例）
 */
export const TaskInstanceStatus = {
  Pending: 'Pending', // 待处理
  InProgress: 'InProgress', // 进行中
  Completed: 'Completed', // 已完成
  Skipped: 'Skipped', // 已跳过
  Expired: 'Expired', // 已过期
} as const;

export type TaskInstanceStatus = (typeof TaskInstanceStatus)[keyof typeof TaskInstanceStatus];
