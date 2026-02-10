/**
 * Send Message
 *
 * 发�?AI 消息用例
 */

import type { IAIMessageApiClient } from '@/infrastructure-client';
import type { SendMessageRequest } from '@dailyuse/contracts/ai';
import { AIMessage } from '@/domain-client';
import { AIContainer } from '@/infrastructure-client';

/**
 * Send Message Input
 */
export type SendMessageInput = SendMessageRequest;

/**
 * Send Message
 */
export class SendMessage {
  private static instance: SendMessage;

  private constructor(private readonly apiClient: IAIMessageApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIMessageApiClient): SendMessage {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getMessageApiClient();
    SendMessage.instance = new SendMessage(client);
    return SendMessage.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): SendMessage {
    if (!SendMessage.instance) {
      SendMessage.instance = SendMessage.createInstance();
    }
    return SendMessage.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    SendMessage.instance = undefined as unknown as SendMessage;
  }

  /**
   * 执行用例
   */
  async execute(input: SendMessageInput): Promise<AIMessage> {
    const data = await this.apiClient.sendMessage(input);
    return AIMessage.fromClientDTO(data);
  }
}

/**
 * 便捷函数
 */
export const sendMessage = (input: SendMessageInput): Promise<AIMessage> =>
  SendMessage.getInstance().execute(input);
