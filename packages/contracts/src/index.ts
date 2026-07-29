/**
 * @memoflow/contracts
 * 统一契约导出 - 根入口（极简版）
 *
 * ⚠️ 此根入口仅导出最核心的响应系统类型。
 * 所有业务模块请使用子路径导入以获得最佳 Tree-Shaking 效果。
 *
 * 🎨 子路径导出架构（推荐使用子路径导入）
 *
 * ```typescript
 * // ✅ 推荐：从子路径导入（极致 Tree-Shaking）
 * import { GoalServerDTO, GoalStatus } from '@memoflow/contracts/goal';
 * import { TaskTemplateServer, TaskType } from '@memoflow/contracts/task';
 * import { HttpResponse, ResultCode } from '@memoflow/contracts/result';
 *
 * // ✅ 命名空间导入（避免命名冲突）
 * import * as GoalContracts from '@memoflow/contracts/goal';
 * import * as TaskContracts from '@memoflow/contracts/task';
 * ```
 *
 * 子路径列表：
 * - @memoflow/contracts/task       - 任务模块
 * - @memoflow/contracts/goal       - 目标模块
 * - @memoflow/contracts/governance - 治理模块
 * - @memoflow/contracts/reminder   - 提醒模块
 * - @memoflow/contracts/repository - 仓库模块
 * - @memoflow/contracts/account    - 账户模块
 * - @memoflow/contracts/authentication - 认证模块
 * - @memoflow/contracts/schedule   - 调度模块
 * - @memoflow/contracts/setting    - 设置模块
 * - @memoflow/contracts/notification - 通知模块
 * - @memoflow/contracts/ai         - AI模块
 * - @memoflow/contracts/dashboard  - 仪表盘模块
 * - @memoflow/contracts/result     - Result Pattern (新，推荐)
 * - @memoflow/contracts/shared     - 共享类型
 */

// ============================================================
// Primitives
// ============================================================
export { brandedId } from './primitives';
export type { IdentityId } from './primitives';

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
  unwrapOrThrowError,
  toResultErrorException,
  unwrapOr,
  map,
  mapError,
  flatMap,
  tryCatch,
  tryCatchSync,
  extractStructuredResultError,
  // Pagination
  okPaged,
  // Batch
  okBatch,
  // Error factories
  ResultErrors,
  ResultErrorException,
  // IPC adapters
  toIpcResult,
  fromIpcResult,
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
} from './result';

export type {
  Result,
  SuccessResult,
  FailureResult,
  ResultError,
  ResultErrorDetail,
  ResultMeta,
  StructuredResultError,
  AsyncResult,
  PageInfo,
  PagedList,
  BatchResult,
  IpcResult,
  HttpResponse,
  HttpResponseOptions,
} from './result';

