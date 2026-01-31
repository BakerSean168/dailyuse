/**
 * AI 任务状态
 */
export const TaskStatus = {
  Pending: 'Pending',
  Processing: 'Processing',
  Completed: 'Completed',
  Failed: 'Failed',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];
