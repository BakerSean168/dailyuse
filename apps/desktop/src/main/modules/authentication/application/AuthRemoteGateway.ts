import { createApiUrl } from '../../../utils/api-config';
import type { AuthResponseDTO, RefreshSessionRequest } from '@dailyuse/contracts/authentication';

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

  async register(request: RegistrationRequestPayload): Promise<RegisterApiResult> {
    const response = await this.fetchImpl(this.createRegisterUrl(), {
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

  async login(request: { email: string; password: string }): Promise<LoginApiResult> {
    const response = await this.fetchImpl(this.createLoginUrl(), {
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

  async refreshToken(request: RefreshSessionRequest): Promise<RefreshApiResult> {
    const response = await this.fetchImpl(this.createRefreshUrl(), {
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
}
