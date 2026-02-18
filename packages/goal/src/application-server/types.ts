/**
 * Goal Application Layer Types
 *
 * 应用层内部类型定义，仅保留执行上下文。
 * 业务响应类型统一使用 @dailyuse/contracts/goal 中的 API 契约类型。
 */

/**
 * 执行上下文 — 从认证中间件提取的身份信息
 */
export interface ExecutionContext {
  identityId: string;
}
