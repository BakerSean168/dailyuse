/**
 * Goal system list views.
 */
export const GoalSystemView = {
  Active: 'active',
  Completed: 'completed',
  Expired: 'expired',
  Deleted: 'deleted',
} as const;

export type GoalSystemView = (typeof GoalSystemView)[keyof typeof GoalSystemView];
