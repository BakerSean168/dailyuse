/**
 * Refresh Token Use Case
 *
 * 刷新访问令牌用例
 */

import type { RefreshTokenRequest, RefreshTokenResponse } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthContainer } from '@dailyuse/infrastructure-client';

/**
 * Refresh Token Use Case
 */
export class RefreshToken {
  private static instance: RefreshToken;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): RefreshToken {
    const container = AuthContainer.getInstance();
    const client = apiClient || container.getApiClient();
    RefreshToken.instance = new RefreshToken(client);
    return RefreshToken.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RefreshToken {
    if (!RefreshToken.instance) {
      RefreshToken.instance = RefreshToken.createInstance();
    }
    return RefreshToken.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RefreshToken.instance = undefined as unknown as RefreshToken;
  }

  /**
   * 执行用例
   */
  async execute(input: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return this.apiClient.refreshToken(input);
  }
}
