/**
 * Result Utilities
 *
 * 为各框架提供 Result 的集成工具
 * - Express 中间件和 helper
 * - 未来可扩展：Fastify、Koa 等
 *
 * @module @dailyuse/utils/result
 */

import {
  type Result,
  type HttpResponse,
  type HttpResponseOptions,
  type PageInfo,
  isOk,
  toHttpResponse,
  getHttpStatusCode,
  createHttpResponseBuilder,
  HttpResponseBuilder,
} from '@dailyuse/contracts/result';

// ============================================================================
// Express Integration Types
// ============================================================================

/**
 * Express Response 接口（避免强依赖 Express）
 */
interface ExpressLikeResponse {
  status(code: number): this;
  json(data: unknown): this;
}

/**
 * Express Request 接口（避免强依赖 Express）
 */
interface ExpressLikeRequest {
  id?: string;
  traceId?: string;
  startTime?: number;
}

// ============================================================================
// Express Response Helper
// ============================================================================

/**
 * Express 响应助手类
 * 提供与 Express Response 对象集成的便捷方法
 */
export class ExpressResultHelper {
  private res: ExpressLikeResponse;
  private builder: HttpResponseBuilder;

  constructor(
    res: ExpressLikeResponse,
    options?: { traceId?: string; startTime?: number },
  ) {
    this.res = res;
    this.builder = createHttpResponseBuilder(options);
  }

  /**
   * 发送成功响应
   */
  success<T>(data: T, message = '操作成功'): ExpressLikeResponse {
    const response = this.builder.success(data, message);
    return this.res.status(200).json(response);
  }

  /**
   * 发送创建成功响应 (201)
   */
  created<T>(data: T, message = '创建成功'): ExpressLikeResponse {
    const response = this.builder.success(data, message);
    return this.res.status(201).json(response);
  }

  /**
   * 发送分页列表响应
   */
  paginated<T>(data: T, pagination: PageInfo, message = '查询成功'): ExpressLikeResponse {
    const response = this.builder.successWithPagination(data, pagination, message);
    return this.res.status(200).json(response);
  }

  /**
   * 发送 Result 响应
   */
  send<T>(result: Result<T>, options?: Omit<HttpResponseOptions, 'traceId' | 'startTime'>): ExpressLikeResponse {
    const response = this.builder.fromResult(result, options);
    return this.res.status(getHttpStatusCode(result)).json(response);
  }

  /**
   * 发送错误响应
   */
  error(response: HttpResponse<never>): ExpressLikeResponse {
    return this.res.status(response.code).json(response);
  }

  // ===== 快捷错误方法 =====

  badRequest(message = '请求参数错误'): ExpressLikeResponse {
    return this.error(this.builder.badRequest(message));
  }

  unauthorized(message = '未授权访问'): ExpressLikeResponse {
    return this.error(this.builder.unauthorized(message));
  }

  forbidden(message = '禁止访问'): ExpressLikeResponse {
    return this.error(this.builder.forbidden(message));
  }

  notFound(message = '资源不存在'): ExpressLikeResponse {
    return this.error(this.builder.notFound(message));
  }

  conflict(message = '资源冲突'): ExpressLikeResponse {
    return this.error(this.builder.conflict(message));
  }

  validationError(message = '参数验证失败'): ExpressLikeResponse {
    return this.error(this.builder.validationError([], message));
  }

  internalError(message = '服务器内部错误'): ExpressLikeResponse {
    return this.error(this.builder.internalError(message));
  }
}

/**
 * 创建 Express 响应助手
 *
 * @example
 * ```ts
 * app.get('/users/:id', async (req, res) => {
 *   const helper = createExpressHelper(res, req);
 *   const result = await userService.getById(req.params.id);
 *   return helper.send(result);
 * });
 * ```
 */
export function createExpressHelper(
  res: ExpressLikeResponse,
  req?: ExpressLikeRequest,
): ExpressResultHelper {
  return new ExpressResultHelper(res, {
    traceId: req?.traceId ?? req?.id,
    startTime: req?.startTime,
  });
}

// ============================================================================
// Express Middleware
// ============================================================================

/**
 * Express 中间件：在 res 对象上附加 result helper
 *
 * @example
 * ```ts
 * app.use(attachResultHelper);
 *
 * app.get('/users/:id', async (req, res) => {
 *   const result = await userService.getById(req.params.id);
 *   return res.result.send(result);
 * });
 * ```
 */
export function attachResultHelper(
  req: ExpressLikeRequest,
  res: ExpressLikeResponse & { result?: ExpressResultHelper },
  next: () => void,
): void {
  res.result = createExpressHelper(res, req);
  next();
}

// ============================================================================
// Send Utilities
// ============================================================================

/**
 * 直接发送 Result 响应
 *
 * @example
 * ```ts
 * app.get('/users/:id', async (req, res) => {
 *   const result = await userService.getById(req.params.id);
 *   return sendResult(res, result);
 * });
 * ```
 */
export function sendResult<T>(
  res: ExpressLikeResponse,
  result: Result<T>,
  options?: HttpResponseOptions,
): ExpressLikeResponse {
  const httpResponse = toHttpResponse(result, options);
  return res.status(getHttpStatusCode(result)).json(httpResponse);
}

/**
 * 发送成功响应
 */
export function sendSuccess<T>(
  res: ExpressLikeResponse,
  data: T,
  message = '操作成功',
  statusCode = 200,
): ExpressLikeResponse {
  const builder = createHttpResponseBuilder();
  return res.status(statusCode).json(builder.success(data, message));
}

/**
 * 发送分页响应
 */
export function sendPaginated<T>(
  res: ExpressLikeResponse,
  data: T,
  pagination: PageInfo,
  message = '查询成功',
): ExpressLikeResponse {
  const builder = createHttpResponseBuilder();
  return res.status(200).json(builder.successWithPagination(data, pagination, message));
}

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
  expressAdapterWithValidation,
  formatZodErrors,
  type ExpressAdapterOptions,
} from './express-adapter';

// ============================================================================
// IPC Adapter
// ============================================================================

export {
  ipcAdapter,
  ipcAdapterWithValidation,
  type IpcAdapterOptions,
} from './ipc-adapter';
