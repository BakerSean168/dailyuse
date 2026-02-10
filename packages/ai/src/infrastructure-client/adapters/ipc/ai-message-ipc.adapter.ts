/**
 * AI Message IPC Adapter
 *
 * IPC implementation of IAIMessageApiClient for Electron desktop app.
 */

import type { IAIMessageApiClient } from '../../ports/ai-message-api-client.port';
import type { IpcClient } from '../../../shared/ipc-client.types';
import type {
  MessageClientDTO,
  MessageListResponse,
  SendMessageRequest,
  ChatStreamRequest,
  ChatStreamChunk,
} from '@dailyuse/contracts/ai';

/**
 * AI Message IPC Adapter
 *
 * Implements IAIMessageApiClient using Electron IPC.
 */
export class AIMessageIpcAdapter implements IAIMessageApiClient {
  private readonly channel = 'ai:message';

  constructor(private readonly ipcClient: IpcClient) {}

  // ===== Message CRUD =====

  async sendMessage(request: SendMessageRequest): Promise<MessageClientDTO> {
    return this.ipcClient.invoke(`${this.channel}:send`, request);
  }

  async getMessages(
    conversationUuid: string,
    params?: {
      page?: number;
      pageSize?: number;
    },
  ): Promise<MessageListResponse> {
    return this.ipcClient.invoke(`${this.channel}:list`, { conversationUuid, ...params });
  }

  async deleteMessage(uuid: string): Promise<void> {
    return this.ipcClient.invoke(`${this.channel}:delete`, uuid);
  }

  // ===== Streaming Chat =====

  async *streamChat(request: ChatStreamRequest): AsyncGenerator<ChatStreamChunk, void, unknown> {
    // IPC 流式实现需要使用 IPC 事件监听
    // 这里提供基本框架，实际需要结合 Electron IPC 事件
    const streamId = await this.ipcClient.invoke(`${this.channel}:stream:start`, request);

    try {
      // 使用 IPC 事件监听流数据
      while (true) {
        const chunk = await this.ipcClient.invoke<ChatStreamChunk>(`${this.channel}:stream:next`, streamId);
        if (chunk.isDone) {
          yield chunk;
          break;
        }
        yield chunk;
      }
    } finally {
      await this.ipcClient.invoke(`${this.channel}:stream:end`, streamId);
    }
  }
}
