import type { IAIMessageApiClient, IResultIpcClient } from '../types';
import { AIChannels } from '@dailyuse/contracts/electron';
import type { MessageListRes, SendMessageReq, SendMessageRes } from '@dailyuse/contracts/ai';

export class AIMessageIpcAdapter implements IAIMessageApiClient {
  constructor(private readonly ipcClient: IResultIpcClient) {}

  async sendMessage(request: SendMessageReq): Promise<SendMessageRes> {
    const result = await this.ipcClient.invoke<SendMessageRes>(AIChannels.MESSAGE_SEND, request);
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }

  async getMessages(
    conversationId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<MessageListRes> {
    const result = await this.ipcClient.invoke<MessageListRes>(AIChannels.MESSAGE_LIST, {
      conversationId,
      ...params,
    });
    if (!result.ok) throw new Error(result.error.message);
    return result.data;
  }
}
