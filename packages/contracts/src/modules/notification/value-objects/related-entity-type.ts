/**
 * 关联实体类型枚举
 */
export const RelatedEntityType = {
  Task: 'Task',
  Goal: 'Goal',
  Schedule: 'Schedule',
  Reminder: 'Reminder',
} as const;

export type RelatedEntityType = (typeof RelatedEntityType)[keyof typeof RelatedEntityType];
