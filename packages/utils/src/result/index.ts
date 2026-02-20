/**
 * Result Utilities
 *
 * 为各框架提供 Result 的集成工具
 * - Express Adapter: 将 Controller 函数适配为 Express 路由处理器
 * - IPC Adapter: 将 Controller 函数适配为 Electron IPC 处理器
 *
 * @module @dailyuse/utils/result
 */

// ============================================================================
// Re-exports from contracts
// ============================================================================

export {
  // Core Result
  ok,
  fail,
  error,
  isOk,
  isFail,
  unwrap,
  unwrapOr,
  map,
  mapError,
  flatMap,
  tryCatch,
  tryCatchSync,
  ResultCode,
  ResultErrors,
  okPaged,
  okBatch,
  // HTTP
  toHttpResponse,
  fromHttpResponse,
  getHttpStatusCode,
  errorCodeToHttpStatus,
  HttpResponseBuilder,
  createHttpResponseBuilder,
  ResultCodeToHttpStatus,
  isClientError,
  isServerError,
  // IPC
  toIpcResult,
  fromIpcResult,
  createIpcClientWrapper,
} from '@dailyuse/contracts/result';

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
} from '@dailyuse/contracts/result';

// ============================================================================
// Express Adapter
// ============================================================================

export {
  expressAdapter,
  formatZodErrors,
  type ExpressAdapterOptions,
} from './express-adapter';

// ============================================================================
// IPC Adapter
// ============================================================================

export {
  ipcAdapter,
  type IpcAdapterOptions,
} from './ipc-adapter';
