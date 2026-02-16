/**
 * AI Message HTTP Adapter
 *
 * HTTP implementation of IAIMessageApiClient.
 */

import type { IHttpClient, IAIMessageApiClient } from '../types';
import type {
  MessageClientDTO,
  MessageListRes,
  SendMessageReq,
  ChatStreamReq,
  ChatStreamChunk,
} from '@dailyuse/contracts/ai';

/**
 * AI Message HTTP Adapter
 *
 * Implements IAIMessageApiClient using HTTP REST API calls.
 */
export class AIMessageHttpAdapter implements IAIMessageApiClient {
  private readonly baseUrl = '/ai/messages';

  constructor(private readonly httpClient: IHttpClient) {}

  // ===== Message CRUD =====

  async sendMessage(request: SendMessageReq): Promise<MessageClientDTO> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getMessages(
    conversationId: string,
    params?: {
      page?: number;
      pageSize?: number;
    },
  ): Promise<MessageListRes> {
    return this.httpClient.get(`/ai/conversations/${conversationId}/messages`, { params });
  }

  async deleteMessage(id: string): Promise<void> {
    return this.httpClient.delete(`${this.baseUrl}/${id}`);
  }

  // ===== Streaming Chat =====

  async *streamChat(request: ChatStreamReq): AsyncGenerator<ChatStreamChunk, void, unknown> {
    // 流式聊天需要 SSE 或 WebSocket，这里提供基本实现框架
    // 实际实现需要根据后端 API 调整
    const response = await fetch(`/api/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Stream chat failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        const lines = text.split('\n').filter((line) => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const chunk = JSON.parse(data) as ChatStreamChunk;
              yield chunk;
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
