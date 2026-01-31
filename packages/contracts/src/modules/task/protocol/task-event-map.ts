// 定义 Task 模块发出的事件
export type TaskEventMap = {
  // TaskStatistics 事件
  'task-statistics:updated': { identityId: string; updatedAt: number };
  'task-statistics:recalculated': { identityId: string; reason: string; calculatedAt: number };
};
