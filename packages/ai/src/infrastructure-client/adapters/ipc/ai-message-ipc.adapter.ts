import type { IAIMessageApiClient, IResultIpcClient } from '../types';
import type { MessageListRes, SendMessageReq, SendMessageRes } from '@dailyuse/contracts/ai';

export class AIMessageIpcAdapter implements IAIMessageApiClient {
  private readonly channel = 'ai:chat:message';

  constructor(private readonly ipcClient: IResultIpcClient) {}

  async sendMessage(request: SendMessageReq): Promise<SendMessageRes> {
    const result = await this.ipcClient.invoke<SendMessageRes>(`${this.channel}:send`, request);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async getMessages(
    conversationId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<MessageListRes> {
    const result = await this.ipcClient.invoke<MessageListRes>(`${this.channel}:list`, {
      conversationId,
      ...params,
    });
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}
