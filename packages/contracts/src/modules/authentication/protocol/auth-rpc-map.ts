// 定义 Auth 模块处理的 RPC 请求
export type AuthRpcMap = {
  'auth:verify-session': [{ token: string }, { valid: boolean; uid?: string }];
};
