/**
 * Example API - Route & Endpoint Definitions
 * 
 * 【规范说明：API 路由定义】
 * 这个文件定义了所有 API 端点、HTTP 方法、路径和对应的请求/响应类型。
 * 作用：
 * 1. API 路由的单一真实源
 * 2. 便于 API 文档生成（如 Swagger）
 * 3. 便于前端生成 API 客户端（如使用 OpenAPI Generator）
 * 4. 便于中间件（如权限检查）引用正确的类型
 */

import type {
  CreateExampleRequest,
  UpdateExampleRequest,
  ListExampleQuery,
} from './requests';
import type {
  ExampleResponse,
  ListExampleResponse,
  CreateExampleResponse,
  UpdateExampleResponse,
  DeleteExampleResponse,
  ErrorResponse,
} from './responses';

/**
 * Example 模块的 API 前缀
 * 【规范说明：API 版本管理】
 * - 如果 API 有不兼容变化，应该增加版本前缀（/v2/)
 * - 保持向下兼容或并行运行多个版本
 */
export const EXAMPLE_API_PREFIX = '/api/examples';

/**
 * 获取单个 Example
 * 【规范说明：RESTful 端点定义】
 * - GET /api/examples/:id
 * - Path Parameter: id (required) - Example ID
 * - Response: ExampleResponse | ErrorResponse
 * - Status Codes:
 *   - 200: Successfully retrieved
 *   - 404: Example not found
 *   - 401: Unauthorized
 */
export const GET_EXAMPLE_ENDPOINT = {
  method: 'GET',
  path: `${EXAMPLE_API_PREFIX}/:id`,
  pathParameters: ['id'],
  responseType: 'ExampleResponse',
  errorResponses: ['404', '401'],
} as const;

/**
 * 列表 Examples
 * 【规范说明：分页列表端点】
 * - GET /api/examples
 * - Query Parameters: page, limit, sortBy, sortOrder, status, search, etc.
 * - Response: ListExampleResponse | ErrorResponse
 * - Status Codes:
 *   - 200: Successfully retrieved
 *   - 400: Invalid query parameters
 *   - 401: Unauthorized
 */
export const LIST_EXAMPLES_ENDPOINT = {
  method: 'GET',
  path: EXAMPLE_API_PREFIX,
  queryParameters: [
    'page',
    'limit',
    'sortBy',
    'sortOrder',
    'status',
    'search',
    'priorityRange',
    'publicOnly',
  ],
  responseType: 'ListExampleResponse',
  errorResponses: ['400', '401'],
} as const;

/**
 * 创建新 Example
 * 【规范说明：POST 创建端点】
 * - POST /api/examples
 * - Request Body: CreateExampleRequest
 * - Response: CreateExampleResponse | ErrorResponse
 * - Status Codes:
 *   - 201: Successfully created
 *   - 400: Validation error
 *   - 401: Unauthorized
 *   - 409: Conflict (e.g., duplicate name)
 * - Side Effects: 发出 ExampleCreatedEvent
 */
export const CREATE_EXAMPLE_ENDPOINT = {
  method: 'POST',
  path: EXAMPLE_API_PREFIX,
  requestBodyType: 'CreateExampleRequest',
  responseType: 'CreateExampleResponse',
  statusCode: 201,
  errorResponses: ['400', '401', '409'],
} as const;

/**
 * 更新 Example
 * 【规范说明：PATCH 更新端点】
 * - PATCH /api/examples/:id
 * - Path Parameter: id (required)
 * - Request Body: UpdateExampleRequest (部分更新)
 * - Response: UpdateExampleResponse | ErrorResponse
 * - Status Codes:
 *   - 200: Successfully updated
 *   - 400: Validation error
 *   - 401: Unauthorized
 *   - 403: Forbidden (无权限修改此字段)
 *   - 404: Example not found
 *   - 409: Conflict (状态转移非法)
 * - Side Effects: 发出 ExampleUpdatedEvent
 */
export const UPDATE_EXAMPLE_ENDPOINT = {
  method: 'PATCH',
  path: `${EXAMPLE_API_PREFIX}/:id`,
  pathParameters: ['id'],
  requestBodyType: 'UpdateExampleRequest',
  responseType: 'UpdateExampleResponse',
  errorResponses: ['400', '401', '403', '404', '409'],
} as const;

/**
 * 删除 Example
 * 【规范说明：DELETE 端点】
 * - DELETE /api/examples/:id
 * - Path Parameter: id (required)
 * - Response: DeleteExampleResponse | ErrorResponse
 * - Status Codes:
 *   - 200: Successfully deleted
 *   - 401: Unauthorized
 *   - 403: Forbidden (无权限删除)
 *   - 404: Example not found
 * - Side Effects: 发出 ExampleDeletedEvent, 可能触发级联删除
 *
 * 【规范说明：软删除 vs 硬删除】
 * 这里使用软删除（设置 deletedAt，逻辑删除）：
 * - 保留历史数据
 * - 默认查询中排除已删除的记录
 * - 如果需要硬删除，添加 forceDelete query parameter
 */
export const DELETE_EXAMPLE_ENDPOINT = {
  method: 'DELETE',
  path: `${EXAMPLE_API_PREFIX}/:id`,
  pathParameters: ['id'],
  responseType: 'DeleteExampleResponse',
  errorResponses: ['401', '403', '404'],
} as const;

/**
 * 【规范说明：端点分组】
 * 将所有端点放在一个对象中，便于：
 * 1. API 文档生成
 * 2. 权限检查中间件引用
 * 3. 前端路由器的类型安全
 */
export const EXAMPLE_API_ENDPOINTS = {
  get: GET_EXAMPLE_ENDPOINT,
  list: LIST_EXAMPLES_ENDPOINT,
  create: CREATE_EXAMPLE_ENDPOINT,
  update: UPDATE_EXAMPLE_ENDPOINT,
  delete: DELETE_EXAMPLE_ENDPOINT,
} as const;
