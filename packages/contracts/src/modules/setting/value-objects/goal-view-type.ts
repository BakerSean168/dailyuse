/**
 * 目标视图类型
 */
export const GoalViewType = {
  List: 'List',
  Tree: 'Tree',
  Timeline: 'Timeline',
} as const;

export type GoalViewType = (typeof GoalViewType)[keyof typeof GoalViewType];
