// 定义 Auth 模块处理的 RPC 请求
export type AuthRpcMap = {
  'auth:verify-session': [{ token: string }, { valid: boolean; uid?: string }];
  'auth:register': [{ username: string; password: string }, { success: boolean; id?: string }];
  'auth:login': [{ username: string; password: string }, { token: string; uid: string }];
  'auth:logout': [{ token: string }, { success: boolean }];
};
