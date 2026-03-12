/**
 * Result Pattern - 统一的操作结果类型系统
 *
 * 借鉴业界最佳实践：
 * - Rust Result<T, E>
 * - fp-ts Either<E, A>
 * - tRPC procedure returns
 * - Zod safe parse
 *
 * 设计原则：
 * 1. Protocol Agnostic - 与传输协议无关（HTTP/IPC/WebSocket）
 * 2. Type Safe - 完整的 TypeScript 类型推断
 * 3. Composable - 支持链式操作和组合
 * 4. Serializable - 可安全序列化传输
 *
 * 使用场景：
 * - HTTP API 响应
 * - IPC 通信
 * - WebSocket 消息
 * - 内部服务调用
 *
 * @module @dailyuse/contracts/result
 */

// ============================================================================
// Re-export ResultCode from codes.ts (to avoid circular dependencies)
// ============================================================================

export { ResultCode, type ResultCode as ResultCodeType } from './codes';
// Re-import for internal use
import { ResultCode } from './codes';

// ============================================================================
// Core Result Types
// ============================================================================

/**
 * 错误详情
 * 用于验证错误等需要多个错误信息的场景
 */
export interface ResultErrorDetail {
  /** 错误字段（验证错误时） */
  field?: string;
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 相关值 */
  value?: unknown;
}

/**
 * 结果元数据
 * 可选的调试/追踪信息
 */
export interface ResultMeta {
  /** 请求追踪 ID */
  traceId?: string;
  /** 操作耗时(ms) */
  duration?: number;
  /** 时间戳 */
  timestamp?: number;
  /** 来源标识 */
  source?: string;
}

/**
 * 成功结果
 */
export interface SuccessResult<T> {
  readonly ok: true;
  readonly data: T;
  readonly meta?: ResultMeta;
}

/**
 * 失败结果
 */
export interface FailureResult<E = ResultError> {
  readonly ok: false;
  readonly error: E;
  readonly meta?: ResultMeta;
}

/**
 * 标准错误对象
 */
export interface ResultError {
  /** 错误码 */
  code: ResultCode | string;
  /** 错误消息 */
  message: string;
  /** 错误详情列表 */
  details?: ResultErrorDetail[];
  /** 结构化业务上下文 */
  context?: Record<string, unknown>;
  /** 原始错误（仅开发环境） */
  cause?: unknown;
}

/**
 * Result 联合类型
 * 表示一个操作可能成功或失败
 */
export type Result<T, E = ResultError> = SuccessResult<T> | FailureResult<E>;

// ============================================================================
// Result Constructors (Factory Functions)
// ============================================================================

/**
 * 创建成功结果
 *
 * @example
 * ```ts
 * const result = ok({ id: '123', name: 'Test' });
 * // { ok: true, data: { id: '123', name: 'Test' } }
 * ```
 */
export function ok<T>(data: T, meta?: ResultMeta): SuccessResult<T> {
  return { ok: true, data, meta };
}

/**
 * 创建失败结果
 *
 * @example
 * ```ts
 * const result = fail({ code: 'NOT_FOUND', message: 'User not found' });
 * // { ok: false, error: { code: 'NOT_FOUND', message: 'User not found' } }
 * ```
 */
export function fail<E = ResultError>(error: E, meta?: ResultMeta): FailureResult<E> {
  return { ok: false, error, meta };
}

/**
 * 创建带标准错误的失败结果
 *
 * @example
 * ```ts
 * const result = error('NOT_FOUND', 'User not found');
 * ```
 */
export function error(
  code: ResultCode | string,
  message: string,
  details?: ResultErrorDetail[],
  meta?: ResultMeta,
): FailureResult<ResultError> {
  return fail({ code, message, details }, meta);
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * 检查结果是否成功
 */
export function isOk<T, E>(result: Result<T, E>): result is SuccessResult<T> {
  return result.ok === true;
}

/**
 * 检查结果是否失败
 */
export function isFail<T, E>(result: Result<T, E>): result is FailureResult<E> {
  return result.ok === false;
}

// ============================================================================
// Result Utilities
// ============================================================================

/**
 * 从 Result 中提取数据，失败时抛出异常
 *
 * @example
 * ```ts
 * const data = unwrap(result); // throws if result.ok === false
 * ```
 */
export function unwrap<T>(result: Result<T>): T {
  if (isOk(result)) {
    return result.data;
  }
  throw new Error(result.error.message);
}

/**
 * 从 Result 中提取数据，失败时返回默认值
 *
 * @example
 * ```ts
 * const data = unwrapOr(result, defaultValue);
 * ```
 */
export function unwrapOr<T>(result: Result<T>, defaultValue: T): T {
  return isOk(result) ? result.data : defaultValue;
}

/**
 * 映射成功结果的数据
 *
 * @example
 * ```ts
 * const mapped = map(result, user => user.name);
 * ```
 */
export function map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.data), result.meta);
  }
  return result;
}

/**
 * 映射失败结果的错误
 */
export function mapError<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
  if (isFail(result)) {
    return fail(fn(result.error), result.meta);
  }
  return result;
}

/**
 * 链式处理成功结果
 *
 * @example
 * ```ts
 * const result = flatMap(userResult, user => getUserProfile(user.id));
 * ```
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => Result<U, E>,
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.data);
  }
  return result;
}

/**
 * 将 Promise 包装为 Result
 *
 * @example
 * ```ts
 * const result = await tryCatch(() => fetchUser(id));
 * ```
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorHandler?: (err: unknown) => ResultError,
): Promise<Result<T>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (err) {
    if (errorHandler) {
      return fail(errorHandler(err));
    }
    return fail({
      code: ResultCode.UNKNOWN,
      message: err instanceof Error ? err.message : 'Unknown error',
      cause: err,
    });
  }
}

/**
 * 同步版本的 tryCatch
 */
export function tryCatchSync<T>(
  fn: () => T,
  errorHandler?: (err: unknown) => ResultError,
): Result<T> {
  try {
    const data = fn();
    return ok(data);
  } catch (err) {
    if (errorHandler) {
      return fail(errorHandler(err));
    }
    return fail({
      code: ResultCode.UNKNOWN,
      message: err instanceof Error ? err.message : 'Unknown error',
      cause: err,
    });
  }
}

// ============================================================================
// Async Result Type
// ============================================================================

/**
 * 异步 Result 类型
 * 用于 async 函数返回值
 */
export type AsyncResult<T, E = ResultError> = Promise<Result<T, E>>;

// ============================================================================
// Pagination Support
// ============================================================================

/**
 * 分页信息
 */
export interface PageInfo {
  /** 当前页（从1开始） */
  page: number;
  /** 每页大小 */
  pageSize: number;
  /** 总记录数 */
  total: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

/**
 * 分页列表数据
 */
export interface PagedList<T> {
  items: T[];
  pageInfo: PageInfo;
}

/**
 * 创建分页成功结果
 */
export function okPaged<T>(
  items: T[],
  pageInfo: PageInfo,
  meta?: ResultMeta,
): SuccessResult<PagedList<T>> {
  return ok({ items, pageInfo }, meta);
}

// ============================================================================
// Common Error Factories
// ============================================================================

/**
 * 常用错误工厂函数
 */
export const ResultErrors = {
  badRequest: (message = '请求参数错误', details?: ResultErrorDetail[]) =>
    error(ResultCode.BAD_REQUEST, message, details),

  unauthorized: (message = '未授权访问') => error(ResultCode.UNAUTHORIZED, message),

  forbidden: (message = '禁止访问') => error(ResultCode.FORBIDDEN, message),

  notFound: (message = '资源不存在') => error(ResultCode.NOT_FOUND, message),

  conflict: (message = '资源冲突') => error(ResultCode.CONFLICT, message),

  validation: (details: ResultErrorDetail[], message = '参数验证失败') =>
    error(ResultCode.VALIDATION_ERROR, message, details),

  internal: (message = '服务器内部错误') => error(ResultCode.INTERNAL_ERROR, message),

  serviceUnavailable: (message = '服务暂不可用') =>
    error(ResultCode.SERVICE_UNAVAILABLE, message),

  timeout: (message = '请求超时') => error(ResultCode.TIMEOUT, message),

  business: (code: string, message: string, details?: ResultErrorDetail[]) =>
    error(code, message, details),
} as const;

// ============================================================================
// Batch Operation Support
// ============================================================================

/**
 * 批量操作结果
 */
export interface BatchResult<T, E = ResultError> {
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failureCount: number;
  /** 总数量 */
  totalCount: number;
  /** 成功的结果 */
  successes: T[];
  /** 失败的结果 */
  failures: Array<{
    index: number;
    input: unknown;
    error: E;
  }>;
}

/**
 * 创建批量操作成功结果
 */
export function okBatch<T, E = ResultError>(
  batch: BatchResult<T, E>,
  meta?: ResultMeta,
): SuccessResult<BatchResult<T, E>> {
  return ok(batch, meta);
}

// ============================================================================
// IPC Adapter (Re-export)
// ============================================================================

export {
  toIpcResult,
  fromIpcResult,
  createIpcClientWrapper,
  type IpcResult,
} from './ipc';

// ============================================================================
// HTTP Adapter (Re-export)
// ============================================================================

export {
  // Converters
  toHttpResponse,
  fromHttpResponse,
  getHttpStatusCode,
  errorCodeToHttpStatus,
  // Builder
  HttpResponseBuilder,
  createHttpResponseBuilder,
  // Utilities
  isClientError,
  isServerError,
  // Constants
  ResultCodeToHttpStatus,
  // Types
  type HttpResponse,
  type HttpResponseOptions,
  // Legacy compatibility
  ResponseCode,
  ResponseBuilder,
  createResponseBuilder,
  type ApiResponse,
  type SuccessResponse,
  type ErrorResponse,
} from './http';

// ============================================================================
// Re-export Action Result Types
// ============================================================================

export {
  // Types
  type ActionResult,
  type ActionResultWithData,
  type CountResult,
  type BatchActionResult,
  type BatchFailure,
  type DeleteResult,
  type ValidationResult,
  type SyncResult,
  type ImportExportResult,
  // Factory Functions
  actionOk,
  actionFail,
  countResult,
  batchActionResult,
  // Type Guards
  isActionOk,
  isActionFail,
} from './action';
