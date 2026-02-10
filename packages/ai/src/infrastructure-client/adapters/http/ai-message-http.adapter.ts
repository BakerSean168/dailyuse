/**
 * AI Message HTTP Adapter
 *
 * HTTP implementation of IAIMessageApiClient.
 */

import type { IAIMessageApiClient } from '../../ports/ai-message-api-client.port';
import type { HttpClient } from '../../../shared/http-client.types';
import type {
  MessageClientDTO,
  MessageListResponse,
  SendMessageRequest,
  ChatStreamRequest,
  ChatStreamChunk,
} from '@dailyuse/contracts/ai';

/**
 * AI Message HTTP Adapter
 *
 * Implements IAIMessageApiClient using HTTP REST API calls.
 */
export class AIMessageHttpAdapter implements IAIMessageApiClient {
  private readonly baseUrl = '/ai/messages';

  constructor(private readonly httpClient: HttpClient) {}

  // ===== Message CRUD =====

  async sendMessage(request: SendMessageRequest): Promise<MessageClientDTO> {
    return this.httpClient.post(this.baseUrl, request);
  }

  async getMessages(
    conversationUuid: string,
    params?: {
      page?: number;
      pageSize?: number;
    },
  ): Promise<MessageListResponse> {
    return this.httpClient.get(`/ai/conversations/${conversationUuid}/messages`, { params });
  }

  async deleteMessage(uuid: string): Promise<void> {
    return this.httpClient.delete(`${this.baseUrl}/${uuid}`);
  }

  // ===== Streaming Chat =====

  async *streamChat(request: ChatStreamRequest): AsyncGenerator<ChatStreamChunk, void, unknown> {
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
