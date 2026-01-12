/**
 * Register Use Case
 *
 * 用户注册用例
 *
 * ⚠️ 注意：当前后端采用事件驱动架构，注册接口只返回 account 信息
 * 前端需要在注册成功后引导用户登录
 */

import type { RegisterRequest } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient, RegisterResponse } from '@dailyuse/infrastructure-client';
import { AuthContainer } from '@dailyuse/infrastructure-client';

/**
 * Register Use Case
 */
export class Register {
  private static instance: Register;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): Register {
    const container = AuthContainer.getInstance();
    const client = apiClient || container.getApiClient();
    Register.instance = new Register(client);
    return Register.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): Register {
    if (!Register.instance) {
      Register.instance = Register.createInstance();
    }
    return Register.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    Register.instance = undefined as unknown as Register;
  }

  /**
   * 执行用例
   */
  async execute(input: RegisterRequest): Promise<RegisterResponse> {
    return this.apiClient.register(input);
  }
}
