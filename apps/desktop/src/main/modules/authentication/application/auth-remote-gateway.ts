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
  GetOAuthUrlReq,
  GetOAuthUrlRes,
  OAuthProvidersRes,
  OAuthCallbackReq,
  OAuthCallbackRes,
  BindOAuthReq,
  BindOAuthRes,
  UnbindOAuthReq,
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

/**
 * First-party auth HTTP body. Memoflow API always serializes Result via HttpResponse
 * envelope (`ok` + `data`/`error`). No raw dual-track payloads.
 */
type AuthHttpEnvelope<T = unknown> = {
  ok?: boolean;
  data?: T;
  message?: string;
  error?:
    | string
    | {
        code?: string;
        message?: string;
        context?: Record<string, unknown>;
      };
  code?: string | number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function hasDataKey(body: unknown): body is AuthHttpEnvelope {
  return isRecord(body) && 'data' in body;
}

function readEnvelopeData<T>(body: unknown): T | undefined {
  if (!hasDataKey(body)) {
    return undefined;
  }
  return body.data as T | undefined;
}

function readErrorPayload(body: unknown): { message?: string; error?: string } {
  if (!isRecord(body)) {
    return {};
  }
  const nested = body.error;
  const nestedMessage =
    typeof nested === 'string'
      ? nested
      : nested && typeof nested === 'object' && typeof nested.message === 'string'
        ? nested.message
        : undefined;
  const message =
    (typeof body.message === 'string' && body.message) || nestedMessage || undefined;
  return {
    message,
    error: typeof nested === 'string' ? nested : nestedMessage,
  };
}

function toResultError(
  status: number,
  body: unknown,
  fallbackMessage: string,
): Result<never> {
  const nested =
    isRecord(body) && 'error' in body ? (body as AuthHttpEnvelope).error : undefined;

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
    (isRecord(body) && typeof body.message === 'string' ? body.message : undefined) ||
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

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function protocolErrorData(message: string): { message: string; error: string } {
  return { message, error: message };
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

  createGetOAuthUrlUrl(): string {
    return this.createApiUrlFn('/auth/oauth/url');
  }

  createOAuthProvidersUrl(): string {
    return this.createApiUrlFn('/auth/oauth/providers');
  }

  createOAuthCallbackUrl(): string {
    return this.createApiUrlFn('/auth/oauth/callback');
  }

  createBindOAuthUrl(): string {
    return this.createApiUrlFn('/auth/oauth/bind');
  }

  createUnbindOAuthUrl(): string {
    return this.createApiUrlFn('/auth/oauth/unbind');
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

    const body = await parseJson(response);
    if (response.ok) {
      const data = readEnvelopeData<RegisterApiResponse>(body);
      if (data === undefined || data === null) {
        return {
          ok: false,
          status: response.status,
          data: protocolErrorData('Auth register response missing data envelope'),
        };
      }
      return {
        ok: true,
        status: response.status,
        data,
      };
    }

    return {
      ok: false,
      status: response.status,
      data: {
        ...readErrorPayload(body),
        message:
          readErrorPayload(body).message ?? `Registration failed (${response.status})`,
      },
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

    const body = await parseJson(response);
    if (response.ok) {
      const data = readEnvelopeData<AuthResponseDTO>(body);
      if (data === undefined || data === null) {
        return {
          ok: false,
          status: response.status,
          data: protocolErrorData('Auth login response missing data envelope'),
        };
      }
      return {
        ok: true,
        status: response.status,
        data,
      };
    }

    return {
      ok: false,
      status: response.status,
      data: {
        ...readErrorPayload(body),
        message: readErrorPayload(body).message ?? `Login failed (${response.status})`,
      },
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

    const body = await parseJson(response);
    if (response.ok) {
      const data = readEnvelopeData<AuthResponseDTO>(body);
      if (data === undefined || data === null) {
        return {
          ok: false,
          status: response.status,
          data: protocolErrorData('Auth refresh response missing data envelope'),
        };
      }
      return {
        ok: true,
        status: response.status,
        data,
      };
    }

    return {
      ok: false,
      status: response.status,
      data: {
        ...readErrorPayload(body),
        message: readErrorPayload(body).message ?? `Refresh failed (${response.status})`,
      },
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

    if (!hasDataKey(payload)) {
      return fail({
        code: 'INTERNAL_ERROR',
        message: `${options.fallbackMessage}: response missing data envelope`,
      });
    }

    if (payload.ok === false) {
      return toResultError(response.status, payload, options.fallbackMessage);
    }

    // Envelope success: data may be undefined for void Result payloads.
    return ok(payload.data as T);
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

  async getOAuthUrl(request: GetOAuthUrlReq): Promise<Result<GetOAuthUrlRes>> {
    return this.postResult<GetOAuthUrlRes>(this.createGetOAuthUrlUrl(), request, {
      fallbackMessage: 'Failed to get OAuth authorize URL',
    });
  }

  async listOAuthProviders(): Promise<Result<OAuthProvidersRes>> {
    const response = await this.fetchImpl(this.createOAuthProvidersUrl(), {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await parseJson(response);
    if (!response.ok) {
      return toResultError(response.status, body, 'Failed to list OAuth providers');
    }
    if (!hasDataKey(body) || body.ok === false) {
      return toResultError(response.status, body, 'Failed to list OAuth providers');
    }
    const data = readEnvelopeData<OAuthProvidersRes>(body);
    if (data === undefined || data === null) {
      return fail({
        code: 'INTERNAL_ERROR',
        message: 'Failed to list OAuth providers: response missing data envelope',
      });
    }
    return ok(data);
  }

  async oauthCallback(request: OAuthCallbackReq): Promise<Result<OAuthCallbackRes>> {
    return this.postResult<OAuthCallbackRes>(this.createOAuthCallbackUrl(), request, {
      fallbackMessage: 'Failed to complete OAuth login',
    });
  }

  async bindOAuth(request: BindOAuthReq, accessToken: string): Promise<Result<BindOAuthRes>> {
    return this.postResult<BindOAuthRes>(this.createBindOAuthUrl(), request, {
      accessToken,
      fallbackMessage: 'Failed to bind OAuth provider',
    });
  }

  async unbindOAuth(request: UnbindOAuthReq, accessToken: string): Promise<Result<void>> {
    return this.postResult<void>(this.createUnbindOAuthUrl(), request, {
      accessToken,
      fallbackMessage: 'Failed to unbind OAuth provider',
    });
  }
}
