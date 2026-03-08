import type { IAIMessageApiClient, IResultHttpClient } from '../types';
import type { MessageListRes, SendMessageReq, SendMessageRes } from '@dailyuse/contracts/ai';

export class AIMessageHttpAdapter implements IAIMessageApiClient {
  private readonly baseUrl = '/ai/chat/messages';

  constructor(private readonly httpClient: IResultHttpClient) {}

  async sendMessage(request: SendMessageReq): Promise<SendMessageRes> {
    const result = await this.httpClient.post<SendMessageRes>(this.baseUrl, request);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
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
