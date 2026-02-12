/**
 * Authentication API Service
 *
 * 直接 HTTP 调用认证模块 API 端点。
 * 基于 fetch API，返回类型化响应。
 *
 * 遵循 governance 模块 API Service 模式：
 * - 直接 fetch 调用
 * - handleResponse<T>() 统一错误处理
 * - 类型化的请求/响应
 */

import type {
  LoginByEmailReq,
  LoginByEmailRes,
  LoginByPhoneReq,
  LoginByPhoneRes,
  RegisterByEmailReq,
  RegisterByEmailRes,
  RegisterByPhoneReq,
  RegisterByPhoneRes,
  SendSmsCodeReq,
  RefreshTokenReq,
  RefreshTokenRes,
  ChangePasswordReq,
  ForgotPasswordReq,
  ResetPasswordReq,
  GetCurrentUserRes,
  ListSessionsRes,
  RevokeSessionReq,
  AuthResponseDTO,
} from '@dailyuse/contracts/authentication';

const BASE_URL = '/api/v1/auth';

/**
 * 处理 API 响应，统一错误处理
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.message || body?.error?.message || response.statusText;
    throw new AuthApiError(message, response.status, body);
  }

  const json = await response.json();
  // API uses envelope: { success, data, message }
  return json.data ?? json;
}

/**
 * Authentication API Error
 */
export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

/**
 * 获取通用请求头
 */
function getHeaders(accessToken?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return headers;
}

/**
 * Authentication API Service
 */
export const authApi = {
  // ========== 登录 ==========

  /**
   * 邮箱登录
   */
  async loginByEmail(req: LoginByEmailReq): Promise<LoginByEmailRes> {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(req),
    });
    return handleResponse<LoginByEmailRes>(response);
  },

  /**
   * 手机号登录
   */
  async loginByPhone(req: LoginByPhoneReq): Promise<LoginByPhoneRes> {
    const response = await fetch(`${BASE_URL}/login/phone`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(req),
    });
    return handleResponse<LoginByPhoneRes>(response);
  },

  // ========== 注册 ==========

  /**
   * 邮箱注册
   */
  async registerByEmail(req: RegisterByEmailReq): Promise<RegisterByEmailRes> {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(req),
    });
    return handleResponse<RegisterByEmailRes>(response);
  },

  /**
   * 手机号注册
   */
  async registerByPhone(req: RegisterByPhoneReq): Promise<RegisterByPhoneRes> {
    const response = await fetch(`${BASE_URL}/register/phone`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(req),
    });
    return handleResponse<RegisterByPhoneRes>(response);
  },

  // ========== 验证码 ==========

  /**
   * 发送短信验证码
   */
  async sendSmsCode(req: SendSmsCodeReq): Promise<void> {
    const response = await fetch(`${BASE_URL}/sms/send`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(req),
    });
    await handleResponse<void>(response);
  },

  // ========== 会话管理 ==========

  /**
   * 刷新令牌
   */
  async refreshToken(req: RefreshTokenReq, accessToken?: string | null): Promise<RefreshTokenRes> {
    const response = await fetch(`${BASE_URL}/refresh`, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify(req),
    });
    return handleResponse<RefreshTokenRes>(response);
  },

  /**
   * 登出
   */
  async logout(accessToken: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/logout`, {
      method: 'POST',
      headers: getHeaders(accessToken),
    });
    await handleResponse<void>(response);
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(accessToken: string): Promise<GetCurrentUserRes> {
    const response = await fetch(`${BASE_URL}/me`, {
      method: 'GET',
      headers: getHeaders(accessToken),
    });
    return handleResponse<GetCurrentUserRes>(response);
  },

  /**
   * 获取活跃会话列表
   */
  async listSessions(accessToken: string): Promise<ListSessionsRes> {
    const response = await fetch(`${BASE_URL}/sessions`, {
      method: 'GET',
      headers: getHeaders(accessToken),
    });
    return handleResponse<ListSessionsRes>(response);
  },

  /**
   * 撤销会话
   */
  async revokeSession(req: RevokeSessionReq, accessToken: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/sessions/revoke`, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify(req),
    });
    await handleResponse<void>(response);
  },

  // ========== 密码管理 ==========

  /**
   * 修改密码
   */
  async changePassword(req: ChangePasswordReq, accessToken: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/password/change`, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify(req),
    });
    await handleResponse<void>(response);
  },

  /**
   * 忘记密码 - 发送重置邮件
   */
  async forgotPassword(req: ForgotPasswordReq): Promise<void> {
    const response = await fetch(`${BASE_URL}/password/forgot`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(req),
    });
    await handleResponse<void>(response);
  },

  /**
   * 重置密码
   */
  async resetPassword(req: ResetPasswordReq): Promise<void> {
    const response = await fetch(`${BASE_URL}/password/reset`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(req),
    });
    await handleResponse<void>(response);
  },
};
