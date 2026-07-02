import type { ResultError } from '@dailyuse/contracts/result';
import { ResultCode } from '@dailyuse/contracts/result';

export type ResultErrorMessageKey =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'TIMEOUT'
  | 'CANCELED'
  | 'UNKNOWN';

export type ResultErrorTranslateFn = (
  key: string,
  params?: Record<string, unknown>,
) => string;

export interface TranslateResultErrorOptions {
  scope?: string;
  fallbackKey?: string;
}

const HTTP_STATUS_TO_RESULT_CODE: Record<number, string> = {
  400: ResultCode.BAD_REQUEST,
  401: ResultCode.UNAUTHORIZED,
  403: ResultCode.FORBIDDEN,
  404: ResultCode.NOT_FOUND,
  408: ResultCode.TIMEOUT,
  409: ResultCode.CONFLICT,
  422: ResultCode.VALIDATION_ERROR,
  429: ResultCode.RATE_LIMITED,
  500: ResultCode.INTERNAL_ERROR,
  502: ResultCode.SERVICE_UNAVAILABLE,
  503: ResultCode.SERVICE_UNAVAILABLE,
  504: ResultCode.TIMEOUT,
};

const RESULT_ERROR_MESSAGES: Record<ResultErrorMessageKey, string> = {
  BAD_REQUEST: '请求参数错误',
  UNAUTHORIZED: '未授权，请登录',
  FORBIDDEN: '拒绝访问',
  NOT_FOUND: '资源不存在',
  CONFLICT: '资源冲突',
  VALIDATION_ERROR: '参数验证失败',
  RATE_LIMITED: '请求过于频繁',
  INTERNAL_ERROR: '服务器内部错误',
  SERVICE_UNAVAILABLE: '服务不可用',
  TIMEOUT: '请求超时',
  CANCELED: '请求已取消',
  UNKNOWN: '操作失败',
};

const RESULT_ERROR_CODE_FALLBACKS: Record<string, string> = {
  USER_ALREADY_EXISTS: ResultCode.CONFLICT,
  AUTH_REQUIRED: ResultCode.UNAUTHORIZED,
  ACCESS_DENIED: ResultCode.FORBIDDEN,
  ENTITY_NOT_FOUND: ResultCode.NOT_FOUND,
  VALIDATION_FAILED: ResultCode.VALIDATION_ERROR,
  REQUEST_TIMEOUT: ResultCode.TIMEOUT,
};

function isResultErrorMessageKey(value: string): value is ResultErrorMessageKey {
  return value in RESULT_ERROR_MESSAGES;
}

export function statusToResultCode(status: number): string {
  return HTTP_STATUS_TO_RESULT_CODE[status] ?? ResultCode.UNKNOWN;
}

export function resolveResultErrorCodeFallback(code: string): string | null {
  return RESULT_ERROR_CODE_FALLBACKS[code] ?? null;
}

export function getDefaultResultErrorMessage(code: string): string {
  return isResultErrorMessageKey(code)
    ? RESULT_ERROR_MESSAGES[code]
    : RESULT_ERROR_MESSAGES.UNKNOWN;
}

export function statusToResultError(status: number, fallbackMessage?: string): ResultError {
  const code = statusToResultCode(status);
  return {
    code,
    message: fallbackMessage ?? getDefaultResultErrorMessage(code),
  };
}

export function normalizeResultError(error: unknown): ResultError | null {
  if (!error || typeof error !== 'object') {
    return null;
  }

  const candidate = error as Partial<ResultError>;
  return {
    code: typeof candidate.code === 'string' ? candidate.code : ResultCode.UNKNOWN,
    message: typeof candidate.message === 'string' ? candidate.message : '',
    details: Array.isArray(candidate.details) ? candidate.details : undefined,
    context:
      candidate.context && typeof candidate.context === 'object'
        ? candidate.context
        : undefined,
    cause: candidate.cause,
  };
}

export function classifyNetworkErrorMessage(message: string | undefined): ResultError {
  if (/timeout/i.test(message ?? '')) {
    return {
      code: ResultCode.TIMEOUT,
      message: '网络请求超时',
    };
  }

  if (message?.includes('Network Error') || message?.includes('ERR_NETWORK')) {
    return {
      code: ResultCode.SERVICE_UNAVAILABLE,
      message: '网络连接断开',
    };
  }

  if (message?.includes('canceled') || message?.includes('aborted')) {
    return {
      code: ResultCode.UNKNOWN,
      message: RESULT_ERROR_MESSAGES.CANCELED,
    };
  }

  return {
    code: ResultCode.SERVICE_UNAVAILABLE,
    message: '网络连接异常',
  };
}

function translateByKey(
  t: ResultErrorTranslateFn,
  key: string | null | undefined,
  params?: Record<string, unknown>,
): string | null {
  if (!key) {
    return null;
  }

  const translated = t(key, params);
  return translated !== key ? translated : null;
}

export function translateResultErrorMessage(
  error: unknown,
  t: ResultErrorTranslateFn,
  options: TranslateResultErrorOptions = {},
): string {
  const normalized = normalizeResultError(error);
  const params = normalized?.context;
  const code = normalized?.code ?? ResultCode.UNKNOWN;
  const fallbackCode = resolveResultErrorCodeFallback(code);
  const candidates = [
    options.scope ? `${options.scope}.errors.${code}` : null,
    options.scope && fallbackCode ? `${options.scope}.errors.${fallbackCode}` : null,
    `errors.${code}`,
    fallbackCode ? `errors.${fallbackCode}` : null,
  ];

  for (const key of candidates) {
    const translated = translateByKey(t, key, params);
    if (translated) {
      return translated;
    }
  }

  if (normalized?.message) {
    return normalized.message;
  }

  return (
    translateByKey(t, options.fallbackKey, params) ??
    translateByKey(t, 'common.operationFailed') ??
    'Operation failed'
  );
}
