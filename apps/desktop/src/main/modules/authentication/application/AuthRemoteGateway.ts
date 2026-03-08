import { createApiUrl } from '../../../utils/api-config';
import type {
  LoginResponse,
  RefreshSessionRequest,
  RefreshSessionResponse,
} from '@dailyuse/contracts/authentication';

export interface RegisterApiResponse {
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
  data: LoginResponse;
}

export interface RefreshApiResult {
  ok: boolean;
  status: number;
  data: RefreshSessionResponse;
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

    const data = (await response.json()) as RegisterApiResponse;

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
      | LoginResponse
      | { data?: LoginResponse; message?: string };
    const data = 'data' in body && body.data ? body.data : (body as LoginResponse);

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
      | RefreshSessionResponse
      | { data?: RefreshSessionResponse; message?: string };
    const data = 'data' in body && body.data ? body.data : (body as RefreshSessionResponse);

    return {
      ok: response.ok,
      status: response.status,
      data,
    };
  }
}
