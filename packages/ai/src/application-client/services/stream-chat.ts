/**
 * Stream Chat
 *
 * AI 流式对话用例
 */

import type { IAIMessageApiClient } from '../../infrastructure-client/adapters/types';
import type { ChatStreamRequest, ChatStreamChunk } from '@dailyuse/contracts/ai';
import { AIContainer } from '../../infrastructure-client/ai.container';

/**
 * Stream Chat Input
 */
export type StreamChatInput = ChatStreamRequest;

/**
 * Stream Chat
 */
export class StreamChat {
  private static instance: StreamChat;

  private constructor(private readonly apiClient: IAIMessageApiClient) {}

  /**
   * 创建服务实例（支持依赖注入）
   */
  static createInstance(apiClient?: IAIMessageApiClient): StreamChat {
    const container = AIContainer.getInstance();
    const client = apiClient || container.getMessageApiClient();
    StreamChat.instance = new StreamChat(client);
    return StreamChat.instance;
  }

  /**
   * 获取服务单例
   */
  static getInstance(): StreamChat {
    if (!StreamChat.instance) {
      StreamChat.instance = StreamChat.createInstance();
    }
    return StreamChat.instance;
  }

  /**
   * 重置实例（用于测试）
   */
  static resetInstance(): void {
    StreamChat.instance = undefined as unknown as StreamChat;
  }

  /**
   * 执行用例 - 返回异步生成�?
   */
  async *execute(input: StreamChatInput): AsyncGenerator<ChatStreamChunk, void, unknown> {
    yield* this.apiClient.streamChat(input);
  }
}

/**
 * 便捷函数
 */
export const streamChat = (input: StreamChatInput): AsyncGenerator<ChatStreamChunk, void, unknown> =>
  StreamChat.getInstance().execute(input);
