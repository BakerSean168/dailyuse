import type {
  ForgotPasswordReq,
  GetOAuthUrlReq,
  GetOAuthUrlRes,
  OAuthProvidersRes,
  OAuthCallbackReq,
  OAuthCallbackRes,
  LoginByEmailReq,
  LoginByEmailRes,
  RegisterByEmailReq,
  RegisterByEmailRes,
  ResetPasswordReq,
  SendEmailCodeReq,
  VerifyEmailCodeReq,
  VerifyEmailCodeRes,
} from '@memoflow/contracts/authentication';
import type { Result, ResultError, ResultMeta } from '@memoflow/contracts/result';
import { classifyNetworkErrorMessage, statusToResultError } from '@memoflow/http-client';

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

/**
 * Residual 1198 keep-boundary: web auth fetch readJson — Response → unknown|null.
 * Parses fetch Response JSON; parse failures become null (envelope recovery).
 * Soft residual 1198: e2e mock stream→Record and desktop fs file readJson differ (no force-merge).
 */
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

async function getAuth<TRes>(path: string): Promise<Result<TRes>> {
  try {
    const response = await fetch(`${AUTH_BASE_URL}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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
      return { ok: true, data: (body ?? {}) as TRes };
    }
    return { ok: false, error: statusToResultError(response.status) };
  } catch (errorLike) {
    const message = errorLike instanceof Error ? errorLike.message : undefined;
    const classified = classifyNetworkErrorMessage(message);
    return createFailure(
      classified.code === 'SERVICE_UNAVAILABLE'
        ? { ...classified, code: 'NETWORK_ERROR' }
        : classified,
      errorLike,
    );
  }
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
    const classified = classifyNetworkErrorMessage(message);
    return createFailure(
      classified.code === 'SERVICE_UNAVAILABLE'
        ? { ...classified, code: 'NETWORK_ERROR' }
        : classified,
      errorLike,
    );
  }
}

export const authWebService = {
  loginByEmail(req: LoginByEmailReq): Promise<Result<LoginByEmailRes>> {
    return postAuth('/login', req);
  },

  registerByEmail(req: RegisterByEmailReq): Promise<Result<RegisterByEmailRes>> {
    return postAuth('/register', req);
  },

  getOAuthUrl(req: GetOAuthUrlReq): Promise<Result<GetOAuthUrlRes>> {
    return postAuth('/oauth/url', req);
  },

  listOAuthProviders(): Promise<Result<OAuthProvidersRes>> {
    return getAuth('/oauth/providers');
  },

  oauthCallback(req: OAuthCallbackReq): Promise<Result<OAuthCallbackRes>> {
    return postAuth('/oauth/callback', req);
  },

  forgotPassword(req: ForgotPasswordReq): Promise<Result<void>> {
    return postAuth('/password/forgot', req);
  },

  resetPassword(req: ResetPasswordReq): Promise<Result<void>> {
    return postAuth('/password/reset', req);
  },

  sendEmailCode(req: SendEmailCodeReq): Promise<Result<void>> {
    return postAuth('/email/send-code', req);
  },

  verifyEmailCode(req: VerifyEmailCodeReq): Promise<Result<VerifyEmailCodeRes>> {
    return postAuth('/email/verify', req);
  },
};
