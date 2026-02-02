/**
 * Example API - Response DTOs
 * 
 * 【规范说明：Response DTO（响应数据对象）】
 * 用于 HTTP 响应的 body。特点：
 * 1. 包含所有用户可见的字段
 * 2. 字段应该是完整的（不缺省数据）
 * 3. 通常与 Client Aggregate DTO 相同或相似
 * 4. 可能包含计算字段（如统计数据）
 */

import type { ExampleClientDTO } from '../aggregates';

/**
 * 单个 Example 的响应
 * 通常直接来自聚合根的 DTO 表示
 */
export type ExampleResponse = ExampleClientDTO;

/**
 * Example 列表响应
 * 【规范说明：分页响应格式】
 * - items: 当前页的数据
 * - total: 总数（用于计算总页数）
 * - page: 当前页码
 * - limit: 每页数量
 * - hasMore: 是否还有下一页（便于前端加载更多）
 */
export interface ListExampleResponse {
  data: ExampleResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    totalPages: number;
  };
}

/**
 * 创建操作的响应
 * 返回新创建的对象
 */
export type CreateExampleResponse = ExampleResponse;

/**
 * 更新操作的响应
 * 返回更新后的对象
 */
export type UpdateExampleResponse = ExampleResponse;

/**
 * 删除操作的响应
 * 【规范说明：Delete Response】
 * - 可以返回被删除的对象（便于 UI 显示）
 * - 或只返回 id（最小化传输）
 * - 这里选择返回完整对象，便于 undo 功能
 */
export type DeleteExampleResponse = ExampleResponse;

/**
 * 通用错误响应
 * 【规范说明：Error Response】
 * 所有 API 错误都应该遵循此格式
 * - code: 机器可读的错误代码
 * - message: 人类可读的错误信息
 * - details: 额外的错误详情（如字段验证错误）
 */
export interface ErrorResponse {
  code: string; // e.g., 'EXAMPLE_NOT_FOUND', 'VALIDATION_ERROR'
  message: string;
  details?: Record<string, unknown>;
  timestamp?: string; // ISO 8601
}

/**
 * 【规范说明：为什么需要 Response DTO】
 * 
 * 不能直接返回 Server 层的模型有以下原因：
 * 1. Server 模型可能包含不应该暴露给客户端的字段
 * 2. Server 模型可能使用复杂类型（如 Map），不易序列化
 * 3. 可以为不同客户端（web, mobile, admin）返回不同格式
 * 4. 避免业务逻辑层与 API 层的紧耦合
 * 
 * 标准的数据流：
 * Database → Persistence DTO → Server Model → Client DTO → Response DTO → HTTP JSON
 *
 * 在大多数情况下，Response DTO ≈ Client DTO（可以相同），
 * 但保留分离的权利，以便未来灵活调整。
 */
