/**
 * 目标状态 — GOAL-2101 simplified
 *
 * Goal answers only Direction + Measurement.
 * `archivedAt` is a display/persistence attribute, not a status value.
 */
export const GoalStatus = {
  Active: 'Active',
  Completed: 'Completed',
  Abandoned: 'Abandoned',
} as const;

export type GoalStatus = (typeof GoalStatus)[keyof typeof GoalStatus];
