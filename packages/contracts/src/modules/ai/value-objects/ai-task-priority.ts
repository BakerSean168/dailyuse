/**
 * AI 任务优先级
 */
export const AITaskPriority = {
  High: 'High',
  Medium: 'Medium',
  Low: 'Low',
} as const;

export type AITaskPriority = (typeof AITaskPriority)[keyof typeof AITaskPriority];
