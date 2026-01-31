// 定义 Auth 模块发出的事件
export type AuthEventMap = {
  'auth:login-success': { ip: string };
  'auth:password-changed': { };
  'auth:identity-created': { identityId: string, createMethod: 'EMAIL' | 'PHONE' | 'OAUTH' | 'API_KEY' };
};
