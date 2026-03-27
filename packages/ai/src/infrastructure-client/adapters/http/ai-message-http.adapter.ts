import type { IAIMessageApiClient, IResultHttpClient } from '../types';
import type { MessageListRes, SendMessageReq, SendMessageRes } from '@dailyuse/contracts/ai';

export class AIMessageHttpAdapter implements IAIMessageApiClient {
  private readonly baseUrl = '/ai/chat/messages';
  private readonly streamUrl = '/ai/chat/messages/sse';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async sendMessage(request: SendMessageReq): Promise<SendMessageRes> {
    const result = await this.httpClient.post<SendMessageRes>(this.baseUrl, request);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async streamMessage(
    request: SendMessageReq,
    handlers: {
      onChunk?: (chunk: { role: 'assistant'; content: string }) => void;
      onDone?: (result: {
        userMessage: SendMessageRes['userMessage'];
        assistantMessage: SendMessageRes['assistantMessage'];
        tokenUsage: SendMessageRes['tokenUsage'];
        providerId: SendMessageRes['providerId'];
        processingTimeMs: number;
      }) => void;
    },
  ): Promise<void> {
    const response = await this.httpClient.stream(this.streamUrl, {
      method: 'POST',
      body: request,
    });

    if (!response.ok) {
      throw new Error(`AI stream request failed: ${response.status}`);
    }

    for await (const event of parseSSE(response)) {
      if (event.event === 'message' && event.data) {
        const payload = JSON.parse(event.data) as { role: 'assistant'; content: string };
        handlers.onChunk?.(payload);
        continue;
      }

      if (event.event === 'done' && event.data) {
        handlers.onDone?.(
          JSON.parse(event.data) as {
            userMessage: SendMessageRes['userMessage'];
            assistantMessage: SendMessageRes['assistantMessage'];
            tokenUsage: SendMessageRes['tokenUsage'];
            providerId: SendMessageRes['providerId'];
            processingTimeMs: number;
          },
        );
        return;
      }

      if (event.event === 'error') {
        const payload = event.data ? JSON.parse(event.data) as { message?: string } : {};
        throw new Error(payload.message ?? 'AI stream failed');
      }
    }
  }

  async getMessages(
    conversationId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<MessageListRes> {
    const result = await this.httpClient.get<MessageListRes>(this.baseUrl, {
      params: { conversationId, ...params },
    });
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}

async function* parseSSE(
  response: Response,
): AsyncGenerator<{ event: string; data: string }, void, void> {
  if (!response.body) {
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    while (true) {
      const boundaryIndex = buffer.indexOf('\n\n');
      if (boundaryIndex < 0) {
        break;
      }

      const rawEvent = buffer.slice(0, boundaryIndex);
      buffer = buffer.slice(boundaryIndex + 2);

      let event = 'message';
      const dataLines: string[] = [];
      for (const line of rawEvent.split(/\r?\n/)) {
        if (line.startsWith('event:')) {
          event = line.slice(6).trim();
          continue;
        }
        if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trimStart());
        }
      }

      yield {
        event,
        data: dataLines.join('\n'),
      };
    }
  }
}
