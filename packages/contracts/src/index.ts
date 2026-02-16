/**
 * @dailyuse/contracts
 * 统一契约导出 - 根入口（极简版）
 *
 * ⚠️ 此根入口仅导出最核心的响应系统类型。
 * 所有业务模块请使用子路径导入以获得最佳 Tree-Shaking 效果。
 *
 * 🎨 子路径导出架构（推荐使用子路径导入）
 *
 * ```typescript
 * // ✅ 推荐：从子路径导入（极致 Tree-Shaking）
 * import { GoalServerDTO, GoalStatus } from '@dailyuse/contracts/goal';
 * import { TaskTemplateServer, TaskType } from '@dailyuse/contracts/task';
 * import { ApiResponse, ResponseCode } from '@dailyuse/contracts/response';
 *
 * // ✅ 命名空间导入（避免命名冲突）
 * import * as GoalContracts from '@dailyuse/contracts/goal';
 * import * as TaskContracts from '@dailyuse/contracts/task';
 * ```
 *
 * 子路径列表：
 * - @dailyuse/contracts/task       - 任务模块
 * - @dailyuse/contracts/goal       - 目标模块
 * - @dailyuse/contracts/reminder   - 提醒模块
 * - @dailyuse/contracts/editor     - 编辑器模块
 * - @dailyuse/contracts/repository - 仓库模块
 * - @dailyuse/contracts/account    - 账户模块
 * - @dailyuse/contracts/authentication - 认证模块
 * - @dailyuse/contracts/schedule   - 调度模块
 * - @dailyuse/contracts/setting    - 设置模块
 * - @dailyuse/contracts/notification - 通知模块
 * - @dailyuse/contracts/document   - 文档模块
 * - @dailyuse/contracts/ai         - AI模块
 * - @dailyuse/contracts/dashboard  - 仪表盘模块
 * - @dailyuse/contracts/response   - 响应系统（旧，保留兼容）
 * - @dailyuse/contracts/result     - Result Pattern (新，推荐)
 * - @dailyuse/contracts/shared     - 共享类型
 */

// ============================================================
// 响应系统（旧版已移除，请使用 @dailyuse/contracts/result）
// ============================================================
// NOTE: ./response 模块已被删除，相关类型现在通过
// @dailyuse/contracts/result 的 Legacy compatibility 导出提供：
// - ResponseCode, ResponseBuilder, createResponseBuilder
// - ApiResponse, SuccessResponse, ErrorResponse

// ============================================================
// Result Pattern（Protocol Agnostic 统一结果类型，推荐）
// ============================================================
export {
  // Core types
  ResultCode,
  // Constructors
  ok,
  fail,
  error,
  // Type guards
  isOk,
  isFail,
  // Utilities
  unwrap,
  unwrapOr,
  map,
  mapError,
  flatMap,
  tryCatch,
  tryCatchSync,
  // Pagination
  okPaged,
  // Batch
  okBatch,
  // Error factories
  ResultErrors,
  // IPC adapters
  toIpcResult,
  fromIpcResult,
  createIpcClientWrapper,
  // HTTP adapters
  toHttpResponse,
  fromHttpResponse,
  getHttpStatusCode,
  errorCodeToHttpStatus,
  HttpResponseBuilder,
  createHttpResponseBuilder,
  ResultCodeToHttpStatus,
  isClientError,
  isServerError,
  // Legacy compatibility
  ResponseCode,
  ResponseBuilder,
  createResponseBuilder,
} from './result';

export type {
  Result,
  SuccessResult,
  FailureResult,
  ResultError,
  ResultErrorDetail,
  ResultMeta,
  AsyncResult,
  PageInfo,
  PagedList,
  BatchResult,
  IpcResult,
  HttpResponse,
  HttpResponseOptions,
  // Legacy compatibility
  ApiResponse,
  SuccessResponse,
  ErrorResponse,
} from './result';
