/**
 * Defines when a task-goal binding should contribute progress to the target KR.
 */
export const TaskGoalBindingTrigger = {
  PerInstance: 'PER_INSTANCE',
  AllInstancesCompleted: 'ALL_INSTANCES_COMPLETED',
} as const;

export type TaskGoalBindingTrigger =
  (typeof TaskGoalBindingTrigger)[keyof typeof TaskGoalBindingTrigger];
