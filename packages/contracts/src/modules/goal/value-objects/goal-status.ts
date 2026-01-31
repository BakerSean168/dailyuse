/**
 * 目标状态
 */
export const GoalStatus = {
  Active: 'Active',         // 活跃中
  Completed: 'Completed',   // 已完成
  Archived: 'Archived',       // 已归档
} as const;

export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];
