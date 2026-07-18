import { createApiUrl } from '../../../utils/api-config';
import type {
  AuthResponseDTO,
  ChangePasswordReq,
  ForgotPasswordReq,
  RefreshSessionRequest,
  ResetPasswordReq,
  SendEmailCodeReq,
  VerifyEmailCodeReq,
  VerifyEmailCodeRes,
} from '@dailyuse/contracts/authentication';
import type { Result } from '@dailyuse/contracts/result';
import { fail, ok } from '@dailyuse/contracts/result';

export interface RegisterApiResponse extends Partial<AuthResponseDTO> {
  identityId?: string;
  sessionId?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
  user?: {
    id?: string;
  };
  message?: string;
  error?: string;
}

export interface RegistrationRequestPayload {
  email: string;
  password: string;
  username?: string;
}

export interface RegisterApiResult {
  ok: boolean;
  status: number;
  data: RegisterApiResponse;
}

export interface LoginApiResult {
  ok: boolean;
  status: number;
  data: AuthResponseDTO | { message?: string; error?: string };
}

export interface RefreshApiResult {
  ok: boolean;
  status: number;
  data: AuthResponseDTO | { message?: string; error?: string };
}

type EnvelopeLike<T> =
  | T
  | {
      data?: T;
      message?: string;
      error?:
        | string
        | {
            code?: string;
            message?: string;
            context?: Record<string, unknown>;
          };
      code?: string;
      ok?: boolean;
    };

function unwrapEnvelope<T>(body: EnvelopeLike<T>): T {
  if (body && typeof body === 'object' && 'data' in body && body.data !== undefined) {
    return body.data as T;
  }
  return body as T;
}

function toResultError(
  status: number,
  body: EnvelopeLike<unknown>,
  fallbackMessage: string,
): Result<never> {
  const nested =
    body && typeof body === 'object' && 'error' in body
      ? (body as { error?: unknown }).error
      : undefined;

  if (nested && typeof nested === 'object' && nested !== null && 'code' in nested) {
    const err = nested as { code?: string; message?: string; context?: Record<string, unknown> };
    return fail({
      code: (err.code as never) ?? 'INTERNAL_ERROR',
      message: err.message ?? fallbackMessage,
      context: err.context,
    });
  }

  const message =
    (typeof nested === 'string' && nested) ||
    (body && typeof body === 'object' && typeof (body as { message?: string }).message === 'string'
      ? (body as { message: string }).message
      : undefined) ||
    fallbackMessage;

  const code =
    status === 401
      ? 'UNAUTHORIZED'
      : status === 403
        ? 'FORBIDDEN'
        : status === 404
          ? 'NOT_FOUND'
          : status === 409
            ? 'CONFLICT'
            : status === 422
              ? 'VALIDATION_ERROR'
              : status === 429
                ? 'RATE_LIMITED'
                : 'INTERNAL_ERROR';

  return fail({ code: code as never, message });
}

async function parseJson(response: Response): Promise<EnvelopeLike<unknown>> {
  try {
    return (await response.json()) as EnvelopeLike<unknown>;
  } catch {
    return {};
  }
}

export class AuthRemoteGateway {
  constructor(
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly createApiUrlFn: typeof createApiUrl = createApiUrl,
  ) {}

  createRegisterUrl(): string {
    return this.createApiUrlFn('/auth/register');
  }

  createLoginUrl(): string {
    return this.createApiUrlFn('/auth/login');
  }

  createRefreshUrl(): string {
    return this.createApiUrlFn('/auth/refresh');
  }

  createForgotPasswordUrl(): string {
    return this.createApiUrlFn('/auth/password/forgot');
  }

  createResetPasswordUrl(): string {
    return this.createApiUrlFn('/auth/password/reset');
  }

  createChangePasswordUrl(): string {
    return this.createApiUrlFn('/auth/password/change');
  }

  createSendEmailCodeUrl(): string {
    return this.createApiUrlFn('/auth/email/send-code');
  }

  createVerifyEmailCodeUrl(): string {
    return this.createApiUrlFn('/auth/email/verify');
  }

  async register(
    request: RegistrationRequestPayload,
    registerUrl: string = this.createRegisterUrl(),
  ): Promise<RegisterApiResult> {
    const response = await this.fetchImpl(registerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const body = (await response.json()) as
      | RegisterApiResponse
      | { data?: RegisterApiResponse; message?: string };
    const data = 'data' in body && body.data ? body.data : (body as RegisterApiResponse);

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }

  async login(
    request: { email: string; password: string },
    loginUrl: string = this.createLoginUrl(),
  ): Promise<LoginApiResult> {
    const response = await this.fetchImpl(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const body = (await response.json()) as
      | AuthResponseDTO
      | { data?: AuthResponseDTO; message?: string; error?: string };
    const data = 'data' in body && body.data ? body.data : body;

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }

  async refreshToken(
    request: RefreshSessionRequest,
    refreshUrl: string = this.createRefreshUrl(),
  ): Promise<RefreshApiResult> {
    const response = await this.fetchImpl(refreshUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const body = (await response.json()) as
      | AuthResponseDTO
      | { data?: AuthResponseDTO; message?: string; error?: string };
    const data = 'data' in body && body.data ? body.data : body;

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }

  private async postResult<T>(
    url: string,
    body: unknown,
    options: { accessToken?: string; fallbackMessage: string },
  ): Promise<Result<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (options.accessToken) {
      headers.Authorization = `Bearer ${options.accessToken}`;
    }

    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const payload = await parseJson(response);
    if (!response.ok) {
      return toResultError(response.status, payload, options.fallbackMessage);
    }

    // Some endpoints return { ok:true, data: null/undefined }
    if (payload && typeof payload === 'object' && 'ok' in payload && (payload as { ok?: boolean }).ok === false) {
      return toResultError(response.status, payload, options.fallbackMessage);
    }

    return ok(unwrapEnvelope(payload as EnvelopeLike<T>));
  }

  async forgotPassword(request: ForgotPasswordReq): Promise<Result<void>> {
    return this.postResult<void>(this.createForgotPasswordUrl(), request, {
      fallbackMessage: 'Failed to request password reset',
    });
  }

  async resetPassword(request: ResetPasswordReq): Promise<Result<void>> {
    return this.postResult<void>(this.createResetPasswordUrl(), request, {
      fallbackMessage: 'Failed to reset password',
    });
  }

  async changePassword(
    request: ChangePasswordReq,
    accessToken: string,
  ): Promise<Result<void>> {
    return this.postResult<void>(this.createChangePasswordUrl(), request, {
      accessToken,
      fallbackMessage: 'Failed to change password',
    });
  }

  async sendEmailCode(
    request: SendEmailCodeReq,
    accessToken?: string,
  ): Promise<Result<void>> {
    return this.postResult<void>(this.createSendEmailCodeUrl(), request, {
      accessToken,
      fallbackMessage: 'Failed to send email verification code',
    });
  }

  async verifyEmailCode(
    request: VerifyEmailCodeReq,
    accessToken?: string,
  ): Promise<Result<VerifyEmailCodeRes>> {
    return this.postResult<VerifyEmailCodeRes>(this.createVerifyEmailCodeUrl(), request, {
      accessToken,
      fallbackMessage: 'Failed to verify email code',
    });
  }
}
