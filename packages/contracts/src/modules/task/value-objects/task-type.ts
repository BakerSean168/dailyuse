/**
 * 任务类型
 */
export const TaskType = {
  OneTime: 'OneTime', // 单次任务
  Recurring: 'Recurring', // 重复任务
} as const;

export type TaskType = (typeof TaskType)[keyof typeof TaskType];
