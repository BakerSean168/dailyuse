/**
 * Account API Service
 *
 * 直接 HTTP 调用账户模块 API 端点。
 * 基于 fetch API，返回类型化响应。
 *
 * 遵循 governance 模块 API Service 模式。
 */

import type {
  GetAccountRes,
  UpdateAccountReq,
  UpdateAccountRes,
  CheckAvailabilityReq,
  CheckAvailabilityRes,
  CloseAccountReq,
  UpdateAccountSettingsReq,
  UpdateAccountSettingsRes,
} from '@dailyuse/contracts/account';

const BASE_URL = '/api/v1/accounts';

/**
 * 处理 API 响应，统一错误处理
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = body?.message || body?.error?.message || response.statusText;
    throw new AccountApiError(message, response.status, body);
  }

  const json = await response.json();
  // API uses envelope: { success, data, message }
  return json.data ?? json;
}

/**
 * Account API Error
 */
export class AccountApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'AccountApiError';
  }
}

/**
 * 获取带认证的请求头
 */
function getHeaders(accessToken: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
}

/**
 * Account API Service
 */
export const accountApi = {
  /**
   * 获取当前账户资料
   */
  async getMyProfile(accessToken: string): Promise<GetAccountRes> {
    const response = await fetch(`${BASE_URL}/me`, {
      method: 'GET',
      headers: getHeaders(accessToken),
    });
    return handleResponse<GetAccountRes>(response);
  },

  /**
   * 更新当前账户资料
   */
  async updateMyProfile(req: UpdateAccountReq, accessToken: string): Promise<UpdateAccountRes> {
    const response = await fetch(`${BASE_URL}/me`, {
      method: 'PUT',
      headers: getHeaders(accessToken),
      body: JSON.stringify(req),
    });
    return handleResponse<UpdateAccountRes>(response);
  },

  /**
   * 检查可用性（昵称/邮箱）
   */
  async checkAvailability(req: CheckAvailabilityReq, accessToken: string): Promise<CheckAvailabilityRes> {
    const response = await fetch(`${BASE_URL}/availability`, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify(req),
    });
    return handleResponse<CheckAvailabilityRes>(response);
  },

  /**
   * 注销账户
   */
  async closeAccount(req: CloseAccountReq, accessToken: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/me/close`, {
      method: 'POST',
      headers: getHeaders(accessToken),
      body: JSON.stringify(req),
    });
    await handleResponse<void>(response);
  },

  /**
   * 更新账户设置
   */
  async updateSettings(req: UpdateAccountSettingsReq, accessToken: string): Promise<UpdateAccountSettingsRes> {
    const response = await fetch(`${BASE_URL}/me/settings`, {
      method: 'PUT',
      headers: getHeaders(accessToken),
      body: JSON.stringify(req),
    });
    return handleResponse<UpdateAccountSettingsRes>(response);
  },
};
