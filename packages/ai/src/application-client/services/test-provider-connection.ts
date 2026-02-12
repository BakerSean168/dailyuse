/**
 * Test Provider Connection
 *
 * 测试 AI Provider 连接用例
 */

import type { IAIProviderConfigApiClient } from '../../infrastructure-client/adapters/types';
import type {
  TestAIProviderConnectionRequest,
  TestAIProviderConnectionResponse,
} from '@dailyuse/contracts/ai';
import { AIContainer } from '../../infrastructure-client/ai.container';

/**
 * Test Provider Connection Input
 */
export type TestProviderConnectionInput = TestAIProviderConnectionRequest;

/**
 * Test Provider Connection
 */
export class TestProviderConnection {
  private static instance: TestProviderConnection;

  private constructor(private readonly apiClient: IAIProviderConfigApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIProviderConfigApiClient): TestProviderConnection {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getProviderConfigApiClient();
    TestProviderConnection.instance = new TestProviderConnection(client);
    return TestProviderConnection.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): TestProviderConnection {
    if (!TestProviderConnection.instance) {
      TestProviderConnection.instance = TestProviderConnection.createInstance();
    }
    return TestProviderConnection.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    TestProviderConnection.instance = undefined as unknown as TestProviderConnection;
  }

  /**
   * 执行用例
   */
  async execute(input: TestProviderConnectionInput): Promise<TestAIProviderConnectionResponse> {
    return this.apiClient.testConnection(input);
  }
}

/**
 * 便捷函数
 */
export const testProviderConnection = (
  input: TestProviderConnectionInput,
): Promise<TestAIProviderConnectionResponse> =>
  TestProviderConnection.getInstance().execute(input);
