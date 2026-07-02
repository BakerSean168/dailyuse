
export const TaskType = {
  OneTime: 'OneTime' as const,
  Recurring: 'Recurring' as const,
} as const;

export type TaskType = typeof TaskType[keyof typeof TaskType];
