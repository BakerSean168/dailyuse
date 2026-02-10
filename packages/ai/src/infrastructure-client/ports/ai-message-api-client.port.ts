/**
 * AI Message API Client Port Interface
 *
 * Defines the contract for AI Message API operations.
 * Implementations: AIMessageHttpAdapter (web), AIMessageIpcAdapter (desktop)
 */

import type {
  MessageClientDTO,
  MessageListResponse,
  SendMessageRequest,
  ChatStreamRequest,
  ChatStreamChunk,
} from '@dailyuse/contracts/ai';

/**
 * AI Message API Client Interface
 */
export interface IAIMessageApiClient {
  // ===== Message CRUD =====

  /** 发送消息 */
  sendMessage(request: SendMessageRequest): Promise<MessageClientDTO>;

  /** 获取消息列表 */
  getMessages(conversationUuid: string, params?: {
    page?: number;
    pageSize?: number;
  }): Promise<MessageListResponse>;

  /** 删除消息 */
  deleteMessage(uuid: string): Promise<void>;

  // ===== Streaming Chat =====

  /** 发送流式聊天请求 */
  streamChat(request: ChatStreamRequest): AsyncGenerator<ChatStreamChunk, void, unknown>;
}
