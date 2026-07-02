import type {
  LoginByEmailReq,
  LoginByEmailRes,
  RegisterByEmailReq,
  RegisterByEmailRes,
} from '@dailyuse/contracts/authentication';
import type { Result, ResultError, ResultMeta } from '@dailyuse/contracts/result';
import { classifyNetworkErrorMessage, statusToResultError } from '@dailyuse/http-client';

const AUTH_BASE_URL = '/api/v1/auth';

function createFailure(error: ResultError, cause?: unknown): Result<never> {
  return {
    ok: false,
    error: {
      ...error,
      ...(cause !== undefined ? { cause } : {}),
    },
  };
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
        error: body.error ?? statusToResultError(response.status),
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
          error: statusToResultError(response.status, candidate.message),
        };
      }
    }

    return {
      ok: false,
      error: statusToResultError(response.status),
    };
  } catch (errorLike) {
    if (errorLike instanceof Error && errorLike.name === 'AbortError') {
      return createFailure(classifyNetworkErrorMessage('aborted'), errorLike);
    }

    const message = errorLike instanceof Error ? errorLike.message : undefined;
    return createFailure(classifyNetworkErrorMessage(message), errorLike);
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
