/**
 * 任务优先级
 */
export const TaskPriority = {
  Low: 'Low', // 低优先级
  Normal: 'Normal', // 普通优先级（默认）
  High: 'High', // 高优先级
  Urgent: 'Urgent', // 紧急优先级
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];
