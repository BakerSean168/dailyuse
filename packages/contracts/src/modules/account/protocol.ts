// 定义 Account 模块发出的事件
export type AccountEventMap = {
  'account:created': { email: string; createdAt: number };
  'account:closed': { reason: string };
  'account:profile-updated': { updatedFields: string[] };
};

// 定义 Account 模块处理的 RPC 请求 [请求, 响应]
export type AccountRpcMap = {
  'account:check-existence': [{ email: string }, boolean];
  'account:get-basic-info': [{ id: string }, { nickname: string; avatar: string } | null];
};