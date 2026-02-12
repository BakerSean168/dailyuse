/**
 * Goal Application Layer Types
 *
 * 应用层内部类型定义，用于 Use Case 的输入输出
 * 遵循 governance 模块 Result<T> 规范
 */

import type { GoalClientDTO } from '@dailyuse/contracts/goal';

/**
 * 执行上下文 — 从认证中间件提取的身份信息
 */
export interface ExecutionContext {
  identityId: string;
}

/**
 * 单个目标响应
 */
export interface GoalResponse {
  goal: GoalClientDTO;
}

/**
 * 目标列表响应
 */
export interface GoalsResponse {
  goals: GoalClientDTO[];
  total: number;
  page: number;
  pageSize: number;
}
