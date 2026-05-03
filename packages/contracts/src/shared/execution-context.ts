/**
 * Execution context — extracted from auth token by middleware.
 * 执行上下文 — 由中间件从认证 token 中提取。
 */
export interface ExecutionContext {
  identityId: string;
}
