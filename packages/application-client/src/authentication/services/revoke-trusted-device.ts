/**
 * Revoke Trusted Device Use Case
 *
 * 取消设备信任用例
 */

import type { RevokeTrustedDeviceRequest } from '@dailyuse/contracts/authentication';
import type { IAuthApiClient } from '@dailyuse/infrastructure-client';
import { AuthContainer } from '@dailyuse/infrastructure-client';

/**
 * Revoke Trusted Device Use Case
 */
export class RevokeTrustedDevice {
  private static instance: RevokeTrustedDevice;

  private constructor(private readonly apiClient: IAuthApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAuthApiClient): RevokeTrustedDevice {
    const container = AuthContainer.getInstance();
    const client = apiClient || container.getApiClient();
    RevokeTrustedDevice.instance = new RevokeTrustedDevice(client);
    return RevokeTrustedDevice.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): RevokeTrustedDevice {
    if (!RevokeTrustedDevice.instance) {
      RevokeTrustedDevice.instance = RevokeTrustedDevice.createInstance();
    }
    return RevokeTrustedDevice.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    RevokeTrustedDevice.instance = undefined as unknown as RevokeTrustedDevice;
  }

  /**
   * 执行用例
   */
  async execute(input: RevokeTrustedDeviceRequest): Promise<void> {
    return this.apiClient.revokeTrustedDevice(input);
  }
}
