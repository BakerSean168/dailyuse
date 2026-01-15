import {
  ResponseStatus,
  ResponseSeverity,
  ResponseCode,
} from '@dailyuse/contracts/response';
import type {
  SuccessResponse,
  ApiErrorResponse,
  ResponseBuilderOptions,
  ErrorDetail,
  PaginationInfo,
  ListResponse,
  BatchResponse,
} from '@dailyuse/contracts/response';
import { newId } from '../shared/uuid';

/**
 * 响应构建器类
 * 提供便捷的方法来构建标准化的API响应
 *
 * @deprecated 请使用 `@dailyuse/contracts/result` 中的 HttpResponseBuilder 替代。
 * 新代码应使用 Result Pattern 实现响应处理。
 *
 * @see {@link @dailyuse/contracts/result} 新的 Result Pattern 模块
 */
export class ResponseBuilder {
  private options: ResponseBuilderOptions;
  private startTime: number;

  constructor(options: ResponseBuilderOptions = {}) {
    this.options = options;
    this.startTime = options.startTime || Date.now();
  }

  /**
   * 生成响应元数据
   */
  private generateMetadata() {
    return {
      requestId: this.options.requestId || newId(),
      timestamp: Date.now(),
      version: this.options.version || '1.0.0',
      duration: Date.now() - this.startTime,
      nodeId: this.options.nodeId || 'default',
    };
  }

  /**
   * 构建成功响应
   */
  success<T>(data: T, message = '操作成功', pagination?: PaginationInfo): SuccessResponse<T> {
    const metadata = this.generateMetadata();
    return {
      code: 200,
      status: ResponseStatus.SUCCESS,
      ok: true,
      message,
      data,
      pagination,
      timestamp: metadata.timestamp,
      traceId: metadata.requestId,
      metadata,
    };
  }

  /**
   * 构建错误响应
   */
  error(
    status: ResponseStatus,
    message: string,
    options: {
      errorCode?: string;
      errors?: ErrorDetail[];
      severity?: ResponseSeverity;
      debug?: any;
    } = {},
  ): ApiErrorResponse {
    const metadata = this.generateMetadata();
    // Map ResponseStatus to ResponseCode
    const codeMap: Record<ResponseStatus, ResponseCode> = {
      SUCCESS: ResponseCode.SUCCESS,
      BAD_REQUEST: ResponseCode.BAD_REQUEST,
      UNAUTHORIZED: ResponseCode.UNAUTHORIZED,
      FORBIDDEN: ResponseCode.FORBIDDEN,
      NOT_FOUND: ResponseCode.NOT_FOUND,
      VALIDATION_ERROR: ResponseCode.VALIDATION_ERROR,
      CONFLICT: ResponseCode.CONFLICT,
      INTERNAL_ERROR: ResponseCode.INTERNAL_ERROR,
      SERVICE_UNAVAILABLE: ResponseCode.SERVICE_UNAVAILABLE,
      DATABASE_ERROR: ResponseCode.DATABASE_ERROR,
      EXTERNAL_SERVICE_ERROR: ResponseCode.EXTERNAL_SERVICE_ERROR,
      BUSINESS_ERROR: ResponseCode.BUSINESS_ERROR,
      DOMAIN_ERROR: ResponseCode.DOMAIN_ERROR,
    };

    return {
      code: codeMap[status] || ResponseCode.INTERNAL_ERROR,
      status,
      ok: false,
      message,
      severity: options.severity || ResponseSeverity.ERROR,
      errorCode: options.errorCode,
      errors: options.errors,
      debug: this.options.includeDebug ? options.debug : undefined,
      timestamp: metadata.timestamp,
      traceId: metadata.requestId,
      metadata,
    };
  }

  /**
   * 构建列表响应
   */
  list<T>(
    items: T[],
    pagination: PaginationInfo,
    message = '获取列表成功',
  ): SuccessResponse<ListResponse<T>> {
    return this.success(
      {
        items,
        pagination,
      },
      message,
    );
  }

  /**
   * 构建批量操作响应
   */
  batch<T>(data: BatchResponse<T>, message = '批量操作完成'): SuccessResponse<BatchResponse<T>> {
    return this.success(data, message);
  }

  // 常用的快捷方法

  /**
   * 请求参数错误
   */
  badRequest(message = '请求参数错误', errors?: ErrorDetail[]): ApiErrorResponse {
    return this.error(ResponseStatus.BAD_REQUEST, message, { errors });
  }

  /**
   * 未授权
   */
  unauthorized(message = '未授权访问'): ApiErrorResponse {
    return this.error(ResponseStatus.UNAUTHORIZED, message);
  }

  /**
   * 禁止访问
   */
  forbidden(message = '禁止访问'): ApiErrorResponse {
    return this.error(ResponseStatus.FORBIDDEN, message);
  }

  /**
   * 资源未找到
   */
  notFound(message = '资源未找到'): ApiErrorResponse {
    return this.error(ResponseStatus.NOT_FOUND, message);
  }

  /**
   * 验证错误
   */
  validationError(message = '数据验证失败', errors?: ErrorDetail[]): ApiErrorResponse {
    return this.error(ResponseStatus.VALIDATION_ERROR, message, {
      errors,
      severity: ResponseSeverity.WARNING,
    });
  }

  /**
   * 资源冲突
   */
  conflict(message = '资源冲突'): ApiErrorResponse {
    return this.error(ResponseStatus.CONFLICT, message);
  }

  /**
   * 内部服务器错误
   */
  internalError(message = '内部服务器错误', debug?: any): ApiErrorResponse {
    return this.error(ResponseStatus.INTERNAL_ERROR, message, {
      severity: ResponseSeverity.CRITICAL,
      debug,
    });
  }

  /**
   * 业务逻辑错误
   */
  businessError(message: string, errorCode?: string): ApiErrorResponse {
    return this.error(ResponseStatus.BUSINESS_ERROR, message, {
      errorCode,
      severity: ResponseSeverity.WARNING,
    });
  }

  /**
   * 领域错误
   */
  domainError(message: string, errorCode?: string): ApiErrorResponse {
    return this.error(ResponseStatus.DOMAIN_ERROR, message, {
      errorCode,
      severity: ResponseSeverity.ERROR,
    });
  }
}

/**
 * 创建响应构建器实例
 */
export function createResponseBuilder(options?: ResponseBuilderOptions): ResponseBuilder {
  return new ResponseBuilder(options);
}

/**
 * 快捷方法：创建成功响应
 */
export function createSuccessResponse<T>(
  data: T,
  message = '操作成功',
  options?: ResponseBuilderOptions,
): SuccessResponse<T> {
  return createResponseBuilder(options).success(data, message);
}

/**
 * 快捷方法：创建错误响应
 */
export function createErrorResponse(
  status: ResponseStatus,
  message: string,
  options?: ResponseBuilderOptions & {
    errorCode?: string;
    errors?: ErrorDetail[];
    severity?: ResponseSeverity;
    debug?: any;
  },
): ApiErrorResponse {
  const builder = createResponseBuilder(options);
  return builder.error(status, message, options);
}
