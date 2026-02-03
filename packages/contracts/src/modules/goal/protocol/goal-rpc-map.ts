// 定义 Goal 模块处理的 RPC 请求 [请求, 响应]
export type GoalRpcMap = {
  'goal:get-by-id': [{ goalId: string }, { goal: unknown } | null];
  'goal:get-statistics': [{ identityId: string }, { totalGoals: number; activeGoals: number; completedGoals: number }];
  'goal:check-existence': [{ goalId: string }, boolean];
  'goal-folder:get-by-id': [{ folderId: string }, { folder: unknown } | null];
  'focus-session:get-active': [{ identityId: string }, { session: unknown } | null];
};

