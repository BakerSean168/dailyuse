/**
 * 可同步实体类型
 */
export const SyncableEntityType = {
  Goal: 'Goal',
  KeyResult: 'KeyResult',
  GoalRecord: 'GoalRecord',
  GoalReview: 'GoalReview',
  Task: 'Task',
  Schedule: 'Schedule',
  Reminder: 'Reminder',
  Settings: 'Settings',
} as const;

export type SyncableEntityType = (typeof SyncableEntityType)[keyof typeof SyncableEntityType];
