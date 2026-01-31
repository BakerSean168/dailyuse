/**
 * 调度任务状态
 */
export const ScheduleTaskStatus = {
  Active: 'Active', // 活跃 - 任务正常运行中
  Paused: 'Paused', // 暂停 - 任务已暂停，不会触发执行
  Completed: 'Completed', // 完成 - 任务已完成所有计划执行
  Cancelled: 'Cancelled', // 取消 - 任务被用户或系统取消
  Failed: 'Failed', // 失败 - 任务因错误而失败
} as const;

export type ScheduleTaskStatus = (typeof ScheduleTaskStatus)[keyof typeof ScheduleTaskStatus];
