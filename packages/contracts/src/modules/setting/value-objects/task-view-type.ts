/**
 * 任务视图类型
 */
export const TaskViewType = {
  List: 'List',
  Kanban: 'Kanban',
  Calendar: 'Calendar',
} as const;

export type TaskViewType = (typeof TaskViewType)[keyof typeof TaskViewType];
