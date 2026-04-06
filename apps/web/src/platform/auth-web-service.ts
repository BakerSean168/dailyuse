import type {
  LoginByEmailReq,
  LoginByEmailRes,
  RegisterByEmailReq,
  RegisterByEmailRes,
} from '@dailyuse/contracts/authentication';
import type { Result, ResultError, ResultMeta } from '@dailyuse/contracts/result';

const AUTH_BASE_URL = '/api/v1/auth';

function createFailure(code: string, message: string, cause?: unknown): Result<never> {
  return {
    ok: false,
    error: {
      code,
      message,
      ...(cause !== undefined ? { cause } : {}),
    },
  };
}

function statusToError(status: number, fallbackMessage?: string): ResultError {
  switch (status) {
    case 400:
      return { code: 'BAD_REQUEST', message: fallbackMessage ?? '请求参数错误' };
    case 401:
      return { code: 'UNAUTHORIZED', message: fallbackMessage ?? '未授权，请登录' };
    case 403:
      return { code: 'FORBIDDEN', message: fallbackMessage ?? '拒绝访问' };
    case 404:
      return { code: 'NOT_FOUND', message: fallbackMessage ?? '资源不存在' };
    case 408:
      return { code: 'TIMEOUT', message: fallbackMessage ?? '请求超时' };
    case 409:
      return { code: 'CONFLICT', message: fallbackMessage ?? '资源冲突' };
    case 422:
      return { code: 'VALIDATION_ERROR', message: fallbackMessage ?? '参数验证失败' };
    case 429:
      return { code: 'RATE_LIMITED', message: fallbackMessage ?? '请求过于频繁' };
    case 500:
      return { code: 'INTERNAL_ERROR', message: fallbackMessage ?? '服务器内部错误' };
    case 502:
    case 503:
      return { code: 'SERVICE_UNAVAILABLE', message: fallbackMessage ?? '服务不可用' };
    case 504:
      return { code: 'TIMEOUT', message: fallbackMessage ?? '网关超时' };
    default:
      return {
        code: 'UNKNOWN',
        message: fallbackMessage ?? `请求失败 (HTTP ${status})`,
      };
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function isResultEnvelope(
  value: unknown,
): value is { ok: boolean; data?: unknown; error?: ResultError; meta?: unknown } {
  return typeof value === 'object' && value !== null && 'ok' in value;
}

function toResultMeta(value: unknown): ResultMeta | undefined {
  return value && typeof value === 'object' ? (value as ResultMeta) : undefined;
}

async function postAuth<TReq, TRes>(path: string, payload: TReq): Promise<Result<TRes>> {
  try {
    const response = await fetch(`${AUTH_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const body = await readJson(response);

    if (isResultEnvelope(body)) {
      if (body.ok) {
        return {
          ok: true,
          data: body.data as TRes,
          ...(toResultMeta(body.meta) ? { meta: toResultMeta(body.meta) } : {}),
        };
      }

      return {
        ok: false,
        error: body.error ?? statusToError(response.status),
        ...(toResultMeta(body.meta) ? { meta: toResultMeta(body.meta) } : {}),
      };
    }

    if (response.ok) {
      return {
        ok: true,
        data: (body ?? {}) as TRes,
      };
    }

    if (typeof body === 'object' && body !== null) {
      const candidate = body as {
        message?: unknown;
        error?: { code?: unknown; message?: unknown; details?: unknown; context?: unknown };
      };
      const error = candidate.error;
      if (error && typeof error.code === 'string' && typeof error.message === 'string') {
        return {
          ok: false,
          error: {
            code: error.code,
            message: error.message,
            ...(Array.isArray(error.details) ? { details: error.details } : {}),
            ...(error.context && typeof error.context === 'object'
              ? { context: error.context as Record<string, unknown> }
              : {}),
          },
        };
      }

      if (typeof candidate.message === 'string') {
        return {
          ok: false,
          error: statusToError(response.status, candidate.message),
        };
      }
    }

    return {
      ok: false,
      error: statusToError(response.status),
    };
  } catch (errorLike) {
    if (errorLike instanceof Error && errorLike.name === 'AbortError') {
      return createFailure('TIMEOUT', '请求已取消', errorLike);
    }

    if (errorLike instanceof Error && /timeout/i.test(errorLike.message)) {
      return createFailure('TIMEOUT', '网络请求超时', errorLike);
    }

    return createFailure('SERVICE_UNAVAILABLE', '网络连接异常', errorLike);
  }
}

export const authWebService = {
  loginByEmail(req: LoginByEmailReq): Promise<Result<LoginByEmailRes>> {
    return postAuth('/login', req);
  },

  registerByEmail(req: RegisterByEmailReq): Promise<Result<RegisterByEmailRes>> {
    return postAuth('/register', req);
  },
};
