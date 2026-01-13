/**
 * 响应系统类型定义
 * 提供统一的API响应格式和错误处理机制
 *
 * @deprecated 请使用 `@dailyuse/contracts/result` 模块替代。
 * 新代码应使用 Result Pattern 实现协议无关的响应处理。
 * 此模块将在后续版本中移除。
 *
 * 迁移指南：
 * - ResponseCode → ResultCode
 * - ResponseBuilder → HttpResponseBuilder (HTTP) 或 toIpcResult (IPC)
 * - SuccessResponse/ErrorResponse → 使用 ok()/fail() 创建 Result
 *
 * @see {@link @dailyuse/contracts/result} 新的 Result Pattern 模块
 */

import { getHttpStatusCode } from './statusCodes';

/**
 * 响应状态码枚举
 * 用于标识响应的业务状态
 */
export const ResponseCode = {
  // 成功状态 (200)
  SUCCESS: 200,

  // 客户端错误 (400-499)
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  TOO_MANY_REQUESTS: 429,

  // 服务器错误 (500-599)
  INTERNAL_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,

  // 业务逻辑错误 (1000-1999)
  BUSINESS_ERROR: 1000,
  DOMAIN_ERROR: 1001,
  DATABASE_ERROR: 1002,
  EXTERNAL_SERVICE_ERROR: 1003,
} as const;

export type ResponseCode = (typeof ResponseCode)[keyof typeof ResponseCode];

/**
 * 响应状态字符串（向后兼容）
 */
export const ResponseStatus = {
  // 成功状态
  SUCCESS: 'SUCCESS',

  // 客户端错误 4xx
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',

  // 服务器错误 5xx
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // 业务逻辑错误
  BUSINESS_ERROR: 'BUSINESS_ERROR',
  DOMAIN_ERROR: 'DOMAIN_ERROR',
} as const;

export type ResponseStatus = (typeof ResponseStatus)[keyof typeof ResponseStatus];

/**
 * 响应严重级别（可选，用于日志）
 */
export const ResponseSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
} as const;

export type ResponseSeverity = (typeof ResponseSeverity)[keyof typeof ResponseSeverity];

/**
 * 错误详情接口
 * 用于详细描述验证错误或业务错误
 */
export interface ErrorDetail {
  /** 错误字段名（验证错误时使用） */
  field?: string;
  /** 错误代码 */
  code: string;
  /** 错误消息 */
  message: string;
  /** 触发错误的值 */
  value?: any;
  /** 约束条件（验证错误时使用） */
  constraints?: Record<string, string>;
}

/**
 * 分页信息接口
 * 用于列表接口的分页数据
 */
export interface PaginationInfo {
  /** 当前页码（从1开始） */
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
 * 基础响应接口
 * 所有API响应的基础结构
 */
export interface BaseResponse {
  /** 响应业务状态码 */
  code: ResponseCode;
  /** 是否成功 */
  success: boolean;
  /** 响应消息 */
  message: string;
  /** 响应时间戳 */
  timestamp: number;
  /** 请求追踪ID（可选） */
  traceId?: string;
}

/**
 * 成功响应接口
 * 用于返回业务数据
 */
export interface SuccessResponse<T = any> extends BaseResponse {
  code: typeof ResponseCode.SUCCESS;
  success: true;
  /** 响应状态字符串（向后兼容） */
  status?: ResponseStatus;
  /** 响应数据 */
  data: T;
  /** 分页信息（列表接口使用） */
  pagination?: PaginationInfo;
  /** 响应元数据（可选） */
  metadata?: {
    requestId?: string;
    timestamp?: number;
    version?: string;
    duration?: number;
    nodeId?: string;
  };
}

/**
 * 错误响应接口
 * 用于返回错误信息
 */
export interface ErrorResponse extends BaseResponse {
  success: false;
  /** 响应状态字符串（向后兼容） */
  status?: ResponseStatus;
  /** 错误严重级别（可选） */
  severity?: ResponseSeverity;
  /** 错误代码（业务错误码） */
  errorCode?: string;
  /** 错误详情列表 */
  errors?: ErrorDetail[];
  /** 调试信息（仅开发环境） */
  debug?: {
    stack?: string;
    query?: any;
    params?: any;
    body?: any;
    environment?: string;
  };
  /** 响应元数据（可选） */
  metadata?: {
    requestId?: string;
    timestamp?: number;
    version?: string;
    duration?: number;
    nodeId?: string;
  };
}

/**
 * API错误响应接口（向后兼容）
 * @deprecated 使用 ErrorResponse 代替
 */
export type ApiErrorResponse = ErrorResponse;

/**
 * 通用API响应类型
 * 所有API接口返回此类型
 */
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * 通用响应类型别名（向后兼容）
 */
export type TResponse<T = any> = ApiResponse<T>;

/**
 * 响应构建器选项
 */
export interface ResponseBuilderOptions {
  /** 请求追踪ID（兼容requestId） */
  traceId?: string;
  /** 请求ID */
  requestId?: string;
  /** 是否包含调试信息 */
  includeDebug?: boolean;
  /** 环境标识 */
  environment?: string;
  /** 开始时间（用于计算响应时长） */
  startTime?: number;
  /** API版本 */
  version?: string;
  /** 节点ID */
  nodeId?: string;
}

/**
 * 响应构建器工具类
 * 提供统一的响应构建方法和便捷的发送方法
 */
export class ResponseBuilder {
  private options: ResponseBuilderOptions;

  constructor(options: ResponseBuilderOptions = {}) {
    this.options = options;
  }

  /**
   * 构建成功响应
   */
  success<T>(data: T, message = '操作成功'): SuccessResponse<T> {
    return {
      code: ResponseCode.SUCCESS,
      success: true,
      message,
      data,
      timestamp: Date.now(),
      traceId: this.options.traceId,
    };
  }

  /**
   * 构建成功响应（带分页）
   */
  successWithPagination<T>(
    data: T,
    pagination: PaginationInfo,
    message = '查询成功',
  ): SuccessResponse<T> {
    return {
      code: ResponseCode.SUCCESS,
      success: true,
      message,
      data,
      pagination,
      timestamp: Date.now(),
      traceId: this.options.traceId,
    };
  }

  /**
   * 构建错误响应
   */
  error(
    code: ResponseCode,
    message: string,
    errorCode?: string,
    errors?: ErrorDetail[],
    debug?: any,
  ): ErrorResponse {
    const response: ErrorResponse = {
      code,
      success: false,
      message,
      timestamp: Date.now(),
      traceId: this.options.traceId,
    };

    if (errorCode) {
      response.errorCode = errorCode;
    }

    if (errors && errors.length > 0) {
      response.errors = errors;
    }

    if (debug && this.options.includeDebug) {
      response.debug = {
        ...debug,
        environment: this.options.environment,
      };
    }

    return response;
  }

  /**
   * 发送成功响应
   * @param res Express Response 对象
   * @param data 响应数据
   * @param message 成功消息
   * @param statusCode HTTP 状态码（默认200）
   */
  sendSuccess<T>(res: any, data: T, message: string, statusCode = 200): any {
    const response = this.success(data, message);
    return res.status(statusCode).json(response);
  }

  /**
   * 发送成功响应（带分页）
   * @param res Express Response 对象
   * @param data 响应数据
   * @param pagination 分页信息
   * @param message 成功消息
   * @param statusCode HTTP 状态码（默认200）
   */
  sendSuccessWithPagination<T>(
    res: any,
    data: T,
    pagination: PaginationInfo,
    message = '查询成功',
    statusCode = 200,
  ): any {
    const response = this.successWithPagination(data, pagination, message);
    return res.status(statusCode).json(response);
  }

  /**
   * 发送错误响应
   * @param res Express Response 对象
   * @param options 错误响应选项
   */
  sendError(
    res: any,
    options: {
      code: ResponseCode;
      message: string;
      errorCode?: string;
      errors?: ErrorDetail[];
      debug?: any;
    },
  ): any {
    const response = this.error(
      options.code,
      options.message,
      options.errorCode,
      options.errors,
      options.debug,
    );
    const httpStatus = getHttpStatusCode(options.code);
    return res.status(httpStatus).json(response);
  }

  /**
   * 构建验证错误响应
   */
  validationError(message = '参数验证失败', errors?: ErrorDetail[]): ErrorResponse {
    return this.error(ResponseCode.VALIDATION_ERROR, message, 'VALIDATION_ERROR', errors);
  }

  /**
   * 构建业务错误响应
   */
  businessError(message: string, errorCode?: string, errors?: ErrorDetail[]): ErrorResponse {
    return this.error(ResponseCode.BUSINESS_ERROR, message, errorCode, errors);
  }

  /**
   * 构建未授权响应
   */
  unauthorized(message = '未授权访问'): ErrorResponse {
    return this.error(ResponseCode.UNAUTHORIZED, message, 'UNAUTHORIZED');
  }

  /**
   * 构建禁止访问响应
   */
  forbidden(message = '无权访问此资源'): ErrorResponse {
    return this.error(ResponseCode.FORBIDDEN, message, 'FORBIDDEN');
  }

  /**
   * 构建资源未找到响应
   */
  notFound(message = '请求的资源不存在'): ErrorResponse {
    return this.error(ResponseCode.NOT_FOUND, message, 'NOT_FOUND');
  }

  /**
   * 构建请求冲突响应
   */
  conflict(message = '资源冲突'): ErrorResponse {
    return this.error(ResponseCode.CONFLICT, message, 'CONFLICT');
  }

  /**
   * 构建服务器错误响应
   */
  internalError(message = '服务器内部错误', debug?: any): ErrorResponse {
    return this.error(ResponseCode.INTERNAL_ERROR, message, 'INTERNAL_ERROR', undefined, debug);
  }

  /**
   * 构建服务不可用响应
   */
  serviceUnavailable(message = '服务暂时不可用'): ErrorResponse {
    return this.error(ResponseCode.SERVICE_UNAVAILABLE, message, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * 创建响应构建器实例
 */
export function createResponseBuilder(options?: ResponseBuilderOptions): ResponseBuilder {
  return new ResponseBuilder(options);
}

/**
 * 列表响应数据结构
 */
export interface ListResponse<T> {
  /** 数据列表 */
  items: T[];
  /** 分页信息 */
  pagination: PaginationInfo;
}

/**
 * 批量操作响应
 */
export interface BatchResponse<T = any> {
  /** 成功处理的数量 */
  successCount: number;
  /** 失败处理的数量 */
  failureCount: number;
  /** 总数量 */
  totalCount: number;
  /** 成功的项目 */
  successes?: T[];
  /** 失败的项目详情 */
  failures?: Array<{
    item: any;
    error: ErrorDetail;
  }>;
}

// 导出状态码相关工具
export * from './statusCodes';
